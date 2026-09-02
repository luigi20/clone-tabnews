import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";
async function create(user_input_values) {
  await validateUniqueEmail(user_input_values.email);
  await validateUniqueUserName(user_input_values.username);
  const new_user = await runInsertQuery(user_input_values);
  return new_user;

  async function validateUniqueEmail(email) {
    const result = await database.query({
      text: `SELECT email FROM users WHERE LOWER(email) = LOWER($1);`,
      values: [email],
    });
    if (result.rowCount > 0)
      throw new ValidationError({
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
  }

  async function validateUniqueUserName(name) {
    const result = await database.query({
      text: `SELECT username FROM users WHERE LOWER(username) = LOWER($1);`,
      values: [name],
    });
    if (result.rowCount > 0)
      throw new ValidationError({
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar o cadastro.",
      });
  }

  async function runInsertQuery(user_input_values) {
    const result = await database.query({
      text: `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
      values: [
        user_input_values.username,
        user_input_values.email,
        user_input_values.password,
      ],
    });
    return result.rows[0];
  }
}

const user = {
  create,
};

export default user;
