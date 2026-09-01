import { createRouter } from "next-connect";
import migration_runner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";
import controller from "infra/controller";
const router = createRouter();

router.get(getHandler);
router.post(postHandler);
export default router.handler(controller.errorHandlers);

const defaultMigrationOptions = {
  dryRun: true,
  dir: join("infra", "migrations"),
  direction: "up",
  verbose: true,
  migrationsTable: "pgmigrations",
};

async function getHandler(req, res) {
  let db_client;
  try {
    db_client = await database.getNewClient();
    const pending = await migration_runner({
      ...defaultMigrationOptions,
      dbClient: db_client,
    });
    return res.status(200).json(pending);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  } finally {
    if (db_client) {
      await db_client.end();
    }
  }
}

async function postHandler(req, res) {
  let db_client;
  try {
    db_client = await database.getNewClient();
    const migrated = await migration_runner({
      ...defaultMigrationOptions,
      dryRun: false,
      dbClient: db_client,
    });
    return res.status(migrated.length ? 201 : 200).json(migrated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  } finally {
    if (db_client) {
      await db_client.end();
    }
  }
}
