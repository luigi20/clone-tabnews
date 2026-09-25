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
  const username = request.query.username;
  const user_found = await user.findOneByUsername(username);
  return response.status(200).json(user_found);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const user_input_values = request.body;
  const user_trying_to_patch = request.context.user;
  const target_user = await user.findOneByUsername(username);
  console.log("oi");
  console.log(target_user);
  if (!authorization.can(user_trying_to_patch, "update:user", target_user))
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário",
      action: "Verifique se você possui a feature para atualizar outro usuário",
    });
  const update_user = await user.update(username, user_input_values);
  return response.status(200).json(update_user);
}
