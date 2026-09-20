import user from "models/user.js";
import password from "models/password.js";
import { NotFoundError, UnauthorizedError } from "infra/errors.js";
async function getAuthenticatedUser(provided_email, provided_password) {
  try {
    const found_user = await findUserByEmail(provided_email);
    await validate_password(provided_password, found_user.password);
    return found_user;
  } catch (error) {
    if (error instanceof UnauthorizedError)
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
      });
    throw error;
  }

  async function findUserByEmail(provided_email) {
    let found_user;
    try {
      found_user = await user.findOneByEmail(provided_email);
    } catch (error) {
      if (error instanceof NotFoundError)
        throw new UnauthorizedError({
          message: "Email de autenticação não conferem.",
          action: "Verifique se os dados enviados estão corretos.",
        });
      throw error;
    }
    return found_user;
  }

  async function validate_password(provided_password, found_user_password) {
    const correctPasswordMatch = await password.compare(
      provided_password,
      found_user_password,
    );
    if (!correctPasswordMatch)
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se este dado está correto.",
      });
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
