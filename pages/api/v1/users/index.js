import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";
import session from "models/session.js";
import activation from "models/activation.js";
import authorization from "models/authorization.js";
const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.post(controller.canRequest("create:user"), postHandler);

router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const user_trying_to_post = request.context.user;
  const user_input_values = request.body;
  const new_user = await user.create(user_input_values);
  const activation_token = await activation.create(new_user.id);
  await activation.send_email_to_user(new_user, activation_token);
  const secure_output_values = authorization.filterOutput(
    user_trying_to_post,
    "read:user",
    new_user,
  );
  return response.status(201).json(secure_output_values);
}

async function getHandler(request, response) {
  const user_trying_to_get = request.context.user;
  const session_token = request.cookies.session_id;
  const session_object = await session.findOneValidByToken(session_token);
  const renewed_session_object = await session.renew(session_object.id);
  controller.setSessionCookie(renewed_session_object.token, response);
  const user_found = await user.findOneById(session_object.user_id);
  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );
  const secure_output_values = authorization.filterOutput(
    user_trying_to_get,
    "read:user:self",
    user_found,
  );
  return response.status(200).json(secure_output_values);
}
