import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import session from "models/session.js";
const router = createRouter();
router.post(postHandler);
router.delete(deleteHandler);
export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const user_input_values = request.body;
  const authenticated_user = await authentication.getAuthenticatedUser(
    user_input_values.email,
    user_input_values.password,
  );
  const new_session = await session.create(authenticated_user.id);
  controller.setSessionCookie(new_session.token, response);
  return response.status(201).json(new_session);
}

async function deleteHandler(request, response) {
  const session_token = request.cookies.session_id;
  const session_object = await session.findOneValidByToken(session_token);
  const expired_session = await session.expireById(session_object.id);
  controller.clearSessionCookie(response);
  return response.status(200).json(expired_session);
}
