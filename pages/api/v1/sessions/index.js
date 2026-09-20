import { createRouter } from "next-connect";
import controller from "infra/controller";
import authentication from "models/authentication.js";
const router = createRouter();
router.post(postHandler);
export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const user_input_values = request.body;
  const authenticated_user = await authentication.getAuthenticatedUser(
    user_input_values.email,
    user_input_values.password,
  );

  return response.status(201).json({});
}
