import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";

const router = createRouter();
router.post(postHandler);
export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const user_input_values = request.body;
  const new_user = await user.create(user_input_values);
  return response.status(201).json(new_user);
}
