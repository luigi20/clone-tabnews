import orchestrator from "tests/orchestrator.js";
import { version as uuid_version } from "uuid";
import user from "models/user.js";
import password from "models/password.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With unique and valid data", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
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
        features: ["read:activation_token"],
        password: response_body.password,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });

      expect(uuid_version(response_body.id)).toBe(4);

      expect(Date.parse(response_body.created_at)).not.toBeNaN();
      expect(Date.parse(response_body.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("filipedeschamps");

      const correctPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "senhaErrada",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("With duplicated email", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
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

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
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
        features: ["read:activation_token"],
        password: response_body.password,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });

      expect(response2.status).toBe(400);

      const response_body2 = await response2.json();

      expect(response_body2).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar está operação.",
        status_code: 400,
      });
    });

    test("With duplicated username", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
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

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
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
        features: ["read:activation_token"],
        password: response_body.password,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });

      expect(response2.status).toBe(400);

      const response_body2 = await response2.json();

      expect(response_body2).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar está operação.",
        status_code: 400,
      });
    });
  });

  describe("Default user", () => {
    test("With unique and valid data", async () => {
      const user1 = await orchestrator.createUser();

      await orchestrator.activate_user(user1);

      const user1SessionObject = await orchestrator.create_session(user1.id);

      const user2Response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "usuariologado",
          email: "usuariologado@curso.dev",
          password: "senha123",
        }),
      });

      expect(user2Response.status).toBe(403);

      const user2ResponseBody = await user2Response.json();

      expect(user2ResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "create:user"',
        status_code: 403,
      });
    });
  });
});
