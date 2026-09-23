import database from "infra/database.js";
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

const session = {
  create,
  expiration_in_milliseconds,
};

export default session;
