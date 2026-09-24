import email from "infra/email.js";
import database from "infra/database.js";
import webserver from "infra/webserver.js";
const expiration_in_milliseconds = 60 * 15 * 1000; // 15 minutes
async function create(user_id) {
  const expires_at = new Date(Date.now() + expiration_in_milliseconds);
  const new_token = await run_insert_query(user_id, expires_at);
  return new_token;

  async function run_insert_query(user_id, expires_at) {
    const result = await database.query({
      text: `
        INSERT INTO 
          user_activation_tokens (user_id, expires_at)
        VALUES
           ($1,$2)
          RETURNING
              *
          ;`,
      values: [user_id, expires_at],
    });
    return result.rows[0];
  }
}
async function send_email_to_user(user, activation_token) {
  await email.send({
    from: "FinTab <contato@fintab.com.br>",
    to: user.email,
    subject: "Ative seu cadastro no FinTab!",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro no FinTab:
${webserver.origin}/cadastro/ativar/${activation_token.id}

Atenciosamente,
Equipe FinTab`,
  });
}

async function findOneValidById(token_id) {
  const activation_token_object = await runSelectQuery(token_id);
  return activation_token_object;

  async function runSelectQuery(token_id) {
    const result = await database.query({
      text: `
        SELECT
          *
        FROM
           user_activation_tokens
        WHERE
            id = $1
            AND expires_at > NOW()
            AND used_at IS NULL
        LIMIT 1
      `,
      values: [token_id],
    });
    if (result.rowCount === 0)
      throw new NotFoundError({
        name: "NotFoundError",
        message:
          "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro.",
      });
    return result.rows[0];
  }
}

const activation = {
  send_email_to_user,
  create,
  findOneValidById,
};

export default activation;
