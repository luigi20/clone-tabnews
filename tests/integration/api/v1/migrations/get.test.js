import database from "infra/database";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await database.query("drop schema public cascade; create schema public;");
});

test("GET TO /api/v1/migrations should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/migrations");
  const response_body = await response.json();
  expect(Array.isArray(response_body)).toBe(true);
  expect(response_body.length).toBeGreaterThan(0);
});
