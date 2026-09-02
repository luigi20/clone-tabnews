import orchestrator from "tests/orchestrator.js";
import { version as uuid_version } from "uuid";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "filipedeschamps",
          email: "filipedeschamps@gmail.com",
          password: "senha123",
        }),
      });
      expect(response.status).toBe(201);
      const response_body = await response.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "filipedeschamps",
        email: "filipedeschamps@gmail.com",
        password: "senha123",
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(uuid_version(response_body.id)).toBe(4);
      expect(Date.parse(response_body.created_at)).not.toBeNaN();
      expect(Date.parse(response_body.updated_at)).not.toBeNaN();
    });

    test("With duplicated email", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado1",
          email: "cursos@gmail.com",
          password: "senha123",
        }),
      });
      expect(response.status).toBe(201);
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2",
          email: "Cursos@gmail.com",
          password: "senha123",
        }),
      });
      const response_body = await response.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "emailduplicado1",
        email: "cursos@gmail.com",
        password: "senha123",
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(response2.status).toBe(400);

      const response_body2 = await response2.json();
      expect(response_body2).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado3",
          email: "cursos1@gmail.com",
          password: "senha123",
        }),
      });
      expect(response.status).toBe(201);
      const response2 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado3",
          email: "cursos2@gmail.com",
          password: "senha123",
        }),
      });
      const response_body = await response.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "emailduplicado3",
        email: "cursos1@gmail.com",
        password: "senha123",
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(response2.status).toBe(400);

      const response_body2 = await response2.json();
      expect(response_body2).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar o cadastro.",
        status_code: 400,
      });
    });
  });
});
