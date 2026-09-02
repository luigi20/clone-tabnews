import migration_runner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

const defaultMigrationOptions = {
  dryRun: true,
  dir: join("infra", "migrations"),
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
};
async function listPendingMigrations() {
  let db_client;
  try {
    db_client = await database.getNewClient();
    const pending = await migration_runner({
      ...defaultMigrationOptions,
      dbClient: db_client,
    });
    return pending;
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  } finally {
    if (db_client) {
      await db_client?.end();
    }
  }
}

async function runPendingMigrations() {
  let db_client;
  try {
    db_client = await database.getNewClient();
    const migrated = await migration_runner({
      ...defaultMigrationOptions,
      dryRun: false,
      dbClient: db_client,
    });
    return migrated;
  } finally {
    await db_client?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};
export default migrator;
