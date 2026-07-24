import database from "infra/database";
import orchestrator from "tests/orchestrator.js";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("drop schema public cascade; create schema public;");
});
test("GET POST /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  expect(response.status).toBe(201);
  const response_body = await response.json();
  const migrationCount = await database.query({
    text: "SELECT COUNT(*)::int FROM pgmigrations",
  });
  expect(migrationCount.rows[0].count).toBe(response_body.length);
  expect(response_body.length).toBeGreaterThan(0);
  expect(Array.isArray(response_body)).toBe(true);
});
