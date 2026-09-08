import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user.js";

const router = createRouter();
router.get(getHandler);
router.patch(patchHandler);
export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const user_found = await user.findOneByUsername(username);
  return response.status(200).json(user_found);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const user_input_values = request.body;
  const update_user = await user.update(username, user_input_values);
  return response.status(200).json(update_user);
}
