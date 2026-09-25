import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import authorization from "models/authorization.js";
import session from "models/session.js";
import { ForbiddenError } from "infra/errors.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.post(controller.canRequest("create:session"), postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const user_input_values = request.body;
  const authenticated_user = await authentication.getAuthenticatedUser(
    user_input_values.email,
    user_input_values.password,
  );
  if (!authorization.can(authenticated_user, "create:session"))
    throw new ForbiddenError({
      message: "Você não possui permissão para fazer login.",
      action: "Contate o suporte caso você acredite que isto seja um erro",
    });
  const new_session = await session.create(authenticated_user.id);
  controller.setSessionCookie(new_session.token, response);
  const secure_output_values = authorization.filterOutput(
    authenticated_user,
    "read:session",
    new_session,
  );
  return response.status(201).json(secure_output_values);
}

async function deleteHandler(request, response) {
  const user_trying_to_delete = request.context.user;
  const session_token = request.cookies.session_id;
  const session_object = await session.findOneValidByToken(session_token);
  const expired_session = await session.expireById(session_object.id);
  controller.clearSessionCookie(response);
  const secure_output_values = authorization.filterOutput(
    user_trying_to_delete,
    "read:session",
    expired_session,
  );
  return response.status(200).json(secure_output_values);
}
