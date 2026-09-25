import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation.js";

const router = createRouter();
router.patch(patchHandler);
export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activation_token_id = request.query.token_id;
  const valid_activation_token =
    await activation.findOneValidById(activation_token_id);
  const used_activation_token = await activation.markTokenAsUsed(
    valid_activation_token.id,
  );
  await activation.activateUserByUserId(valid_activation_token.user_id);
  return response.status(201).json(used_activation_token);
}
