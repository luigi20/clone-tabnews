import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});
test("POST TO /api/v1/status should return 200", async () => {
  const response = await fetch("http://localhost:3000/api/v1/status", {
    method: "POST",
  });
  const responseBody = await response.json();
  expect(responseBody).toEqual({
    name: "MethodNotAllowedError",
    message: "Método não permitido para este endpoint.",
    action: "Verifique se o método HTTP enviado é válido para este endpoint",
    status_code: 405,
  });
  expect(response.status).toBe(405);
});
