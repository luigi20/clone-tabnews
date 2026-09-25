import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation.js";

const router = createRouter();
router.use(controller.injectAnonymousOrUser);
router.patch(controller.canRequest("read:activation_token"), patchHandler);
export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activation_token_id = request.query.token_id;
  const valid_activation_token =
    await activation.findOneValidById(activation_token_id);
  await activation.activateUserByUserId(valid_activation_token.user_id);
  const used_activation_token = await activation.markTokenAsUsed(
    valid_activation_token.id,
  );
  return response.status(201).json(used_activation_token);
}
