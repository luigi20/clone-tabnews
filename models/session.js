import database from "infra/database.js";
import { UnauthorizedError } from "infra/errors";
import crypto from "node:crypto";

const expiration_in_milliseconds = 60 * 60 * 24 * 30 * 1000; // 30 Days
async function create(user_id) {
  const token = crypto.randomBytes(48).toString("hex");
  const expires_at = new Date(Date.now() + expiration_in_milliseconds);
  const new_session = await run_insert_query(token, user_id, expires_at);
  return new_session;

  async function run_insert_query(token, user_id, expires_at) {
    const result = await database.query({
      text: `
        INSERT INTO 
          sessions (token, user_id, expires_at)
        VALUES
           ($1,$2,$3)
          RETURNING
              *
          ;`,
      values: [token, user_id, expires_at],
    });
    return result.rows[0];
  }
}

async function findOneValidByToken(session_token) {
  const session_found = await runSelectQuery(session_token);
  return session_found;

  async function runSelectQuery(session_token) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM
          sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT
          1
      ;`,
      values: [session_token],
    });
    if (result.rowCount === 0)
      throw new UnauthorizedError({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    return result.rows[0];
  }
}

async function renew(session_id) {
  const expires_at = new Date(Date.now() + expiration_in_milliseconds);
  const renewed_session_object = runUpdateQuery(session_id, expires_at);
  return renewed_session_object;

  async function runUpdateQuery(session_id, expires_at) {
    const result = await database.query({
      text: `
      UPDATE
        sessions
      SET
        expires_at=$2,
        updated_at = NOW()
      WHERE
       id=$1
      RETURNING
          *
      ;`,
      values: [session_id, expires_at],
    });
    return result.rows[0];
  }
}

async function expireById(session_id) {
  const expired_session_object = await runUpdateQuery(session_id);
  return expired_session_object;

  async function runUpdateQuery(session_id) {
    const result = await database.query({
      text: `
        UPDATE
          sessions
        SET
          expires_at = expires_at - interval '1 year',
          updated_at = NOW()
        WHERE
          id = $1
        RETURNING
            *;
      `,
      values: [session_id],
    });
    return result.rows[0];
  }
}
const session = {
  create,
  expiration_in_milliseconds,
  findOneValidByToken,
  renew,
  expireById,
};

export default session;
