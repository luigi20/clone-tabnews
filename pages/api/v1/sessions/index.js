import { createRouter } from "next-connect";
import * as cookie from "cookie";
import controller from "infra/controller";
import authentication from "models/authentication.js";
import session from "models/session.js";
const router = createRouter();
router.post(postHandler);
export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const user_input_values = request.body;
  const authenticated_user = await authentication.getAuthenticatedUser(
    user_input_values.email,
    user_input_values.password,
  );
  const new_session = await session.create(authenticated_user.id);
  const setCookie = cookie.serialize("session_id", new_session.token, {
    path: "/",
    maxAge: session.expiration_in_milliseconds / 1000,
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
  return response.status(201).json(new_session);
}
