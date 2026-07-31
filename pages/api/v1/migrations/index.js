import migration_runner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";
export default async function migrations(req, res) {
  const allowed_methods = ["GET", "POST"];
  if (!allowed_methods.includes(req.method)) {
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
    });
  }
  let db_client;

  try {
    db_client = await database.getNewClient();

    const defaultMigrationOptions = {
      dbClient: db_client,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    if (req.method === "GET") {
      const pending = await migration_runner(defaultMigrationOptions);
      return res.status(200).json(pending);
    }

    if (req.method === "POST") {
      const migrated = await migration_runner({
        ...defaultMigrationOptions,
        dryRun: false,
      });

      return res.status(migrated.length ? 201 : 200).json(migrated);
    }

    return res.status(405).end();
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
