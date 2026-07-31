import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("GET /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");
      const response_body = await response.json();
      expect(Array.isArray(response_body)).toBe(true);
      expect(response_body.length).toBeGreaterThan(0);
    });
  });
});
