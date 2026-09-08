import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "MesmoCase",
          email: "mesmo.case@curso.dev",
          password: "senha123",
        }),
      });
      expect(response.status).toBe(201);
      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/MesmoCase",
      );
      const response_body = await response2.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "MesmoCase",
        email: "mesmo.case@curso.dev",
        password: response_body.password,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(response2.status).toBe(200);
    });

    test("With case mismatch", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "CaseDiferente",
          email: "Case.Diferente@curso.dev",
          password: "senha123",
        }),
      });
      expect(response.status).toBe(201);
      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/caseDiferente",
      );
      const response_body = await response2.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "CaseDiferente",
        email: "Case.Diferente@curso.dev",
        password: response_body.password,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(response2.status).toBe(200);
    });

    test("With nonexistent", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/caseDiferente2",
      );
      expect(response.status).toBe(404);
      const response_body = await response.json();
      expect(response_body).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });
  });
});
