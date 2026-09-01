import { createRouter } from "next-connect";
import controller from "infra/controller";
import migrator from "models/migrator.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);
export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pending_migrations = await migrator.listPendingMigrations();
  return response.status(200).json(pending_migrations);
}

async function postHandler(request, response) {
  const migrated = await migrator.runPendingMigrations();
  if (migrated.length > 0) return response.status(201).json(migrated);
  return response.status(200).json(migrated);
}
