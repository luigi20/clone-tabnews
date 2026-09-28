import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});
test("GET TO /api/v1/status should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status");
  expect(response.status).toBe(200);
  const response_body = await response.json();
  expect(response).toBeDefined();
  const response_parsed_updated_at = new Date(
    response_body.updated_at,
  ).toISOString();
  expect(response_body.updated_at).toEqual(response_parsed_updated_at);
  expect(response_body.dependencies.database.max_connections).toBeDefined();
});
