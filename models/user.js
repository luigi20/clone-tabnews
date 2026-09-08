import database from "infra/database.js";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";
async function create(user_input_values) {
  await validateUniqueEmail(user_input_values.email);
  await validateUniqueUserName(user_input_values.username);
  await hash_password_in_object(user_input_values);
  const new_user = await runInsertQuery(user_input_values);
  return new_user;

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

async function hash_password_in_object(userInputValues) {
  const hash_password = await password.hash(userInputValues.password);
  userInputValues.password = hash_password;
}
async function update(user_name, user_input_values) {
  const found_user = await findOneByUsername(user_name);
  if ("username" in user_input_values)
    await validateUniqueUserName(user_input_values.username);
  if ("email" in user_input_values)
    await validateUniqueEmail(user_input_values.email);
  if ("password" in user_input_values)
    await hash_password_in_object(user_input_values);
  const user_with_new_values = { ...found_user, ...user_input_values };
  const update_user = await runUpdateQuery(user_with_new_values);
  return update_user;

  async function runUpdateQuery(user_with_new_values) {
    const result = await database.query({
      text: `
      UPDATE
        users
      SET
        username = $2,
        email=$3,
        password = $4,
        updated_at = timezone('utc',now())
      WHERE
        id = $1
      RETURNING
        *`,
      values: [
        user_with_new_values.id,
        user_with_new_values.username,
        user_with_new_values.email,
        user_with_new_values.password,
      ],
    });
    if (result.rowCount === 0)
      throw new NotFoundError({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    return result.rows[0];
  }
}

async function findOneByUsername(username) {
  const result = await runSelectQuery(username);
  return result;

  async function runSelectQuery(username) {
    const result = await database.query({
      text: `SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      values: [username],
    });
    if (result.rowCount === 0)
      throw new NotFoundError({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    return result.rows[0];
  }
}

async function validateUniqueUserName(name) {
  const result = await database.query({
    text: `SELECT username FROM users WHERE LOWER(username) = LOWER($1);`,
    values: [name],
  });
  if (result.rowCount > 0)
    throw new ValidationError({
      message: "O username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar está operação.",
    });
}

async function validateUniqueEmail(email) {
  const result = await database.query({
    text: `SELECT email FROM users WHERE LOWER(email) = LOWER($1);`,
    values: [email],
  });
  if (result.rowCount > 0)
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar está operação.",
    });
}

const user = {
  create,
  findOneByUsername,
  update,
};

export default user;
