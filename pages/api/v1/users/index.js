import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import session from "models/session.js";

const router = createRouter();
router.post(postHandler);
router.get(getHandler);
export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const user_input_values = request.body;
  const new_user = await user.create(user_input_values);
  return response.status(201).json(new_user);
}

async function getHandler(request, response) {
  const session_token = request.cookies.session_id;
  const session_object = await session.findOneValidByToken(session_token);
  const renewed_session_object = await session.renew(session_object.id);
  controller.setSessionCookie(renewed_session_object.token, response);
  const user_found = await user.findOneById(session_object.user_id);
  return response.status(200).json(user_found);
}
