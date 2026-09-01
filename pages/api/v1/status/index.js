import { createRouter } from "next-connect";
import database from "infra/database";
import controller from "infra/controller";
const router = createRouter();

export default router.handler(controller.errorHandlers);
router.get(getHandler);

async function getHandler(request, response) {
  const result_version = await database.query("SHOW server_version;");
  const result_connections = await database.query(`
    SELECT
      (SELECT setting::int
       FROM pg_settings
       WHERE name = 'max_connections') AS max_connections,
      count(*) AS used_connections,
      (SELECT setting::int
       FROM pg_settings
       WHERE name = 'max_connections') - count(*) AS available_connections
    FROM pg_stat_activity;
  `);
  const updated_at = new Date().toISOString();
  response.status(200).json({
    updated_at: updated_at,
    version: result_version.rows[0].server_version,
    max_connections: result_connections.rows[0].max_connections,
    used_connections: result_connections.rows[0].used_connections,
  });
}
