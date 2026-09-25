import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import { ForbiddenError } from "infra/errors.js";
import authorization from "models/authorization.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const user_trying_to_get = request.context.user;
  const username = request.query.username;
  const user_found = await user.findOneByUsername(username);
  const secure_output_values = authorization.filterOutput(
    user_trying_to_get,
    "read:user",
    user_found,
  );
  return response.status(200).json(secure_output_values);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const user_input_values = request.body;
  const user_trying_to_patch = request.context.user;
  const target_user = await user.findOneByUsername(username);
  if (!authorization.can(user_trying_to_patch, "update:user", target_user))
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário",
      action: "Verifique se você possui a feature para atualizar outro usuário",
    });
  const updated_user = await user.update(username, user_input_values);
  const secure_output_values = authorization.filterOutput(
    user_trying_to_patch,
    "read:user",
    updated_user,
  );
  return response.status(200).json(secure_output_values);
}
