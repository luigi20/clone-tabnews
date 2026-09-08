import orchestrator from "tests/orchestrator.js";
import { version as uuid_version } from "uuid";
import user from "models/user.js";
import password from "models/password.js";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With nonexistent 'username'", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/caseDiferente2",
        {
          method: "PATCH",
        },
      );
      expect(response.status).toBe(404);
      /*const response_body = await response.json();
      expect(response_body).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });*/
    });

    test("With duplicated 'username'", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
          email: "usernameduplicado@curso.dev",
          password: "senha123",
        }),
      });
      expect(user1Response.status).toBe(201);
      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user2",
          email: "user2nameduplicado@curso.dev",
          password: "senha123",
        }),
      });
      expect(user2Response.status).toBe(201);

      const response = await fetch("http://localhost:3000/api/v1/users/user2", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "user1",
        }),
      });
      expect(response.status).toBe(400);
      const response_body = await response.json();
      expect(response_body).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar está operação.",
        status_code: 400,
      });
    });

    test("With duplicated 'email'", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email1",
          email: "email1eduplicado@curso.dev",
          password: "senha123",
        }),
      });
      expect(user1Response.status).toBe(201);
      const user2Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "email2",
          email: "email2nameduplicado@curso.dev",
          password: "senha123",
        }),
      });
      expect(user2Response.status).toBe(201);

      const response = await fetch(
        "http://localhost:3000/api/v1/users/email2",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "email1eduplicado@curso.dev",
          }),
        },
      );
      expect(response.status).toBe(400);
      const response_body = await response.json();
      expect(response_body).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar está operação.",
        status_code: 400,
      });
    });

    test("With unique 'username'", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "uniqueuser1",
          email: "uniqueuser1@curso.dev",
          password: "senha123",
        }),
      });
      expect(user1Response.status).toBe(201);
      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueuser1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: "uniqueuser2",
          }),
        },
      );
      expect(response.status).toBe(200);
      const response_body = await response.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "uniqueuser2",
        email: "uniqueuser1@curso.dev",
        password: response_body.password,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(uuid_version(response_body.id)).toBe(4);
      expect(Date.parse(response_body.created_at)).not.toBeNaN();
      expect(Date.parse(response_body.updated_at)).not.toBeNaN();
      expect(response_body.updated_at > response_body.created_at).toBe(true);
    });

    test("With unique 'email'", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "uniqueemail1",
          email: "uniqueemail1@curso.dev",
          password: "senha123",
        }),
      });
      expect(user1Response.status).toBe(201);
      const response = await fetch(
        "http://localhost:3000/api/v1/users/uniqueemail1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "uniqueemail2@curso.dev",
          }),
        },
      );
      expect(response.status).toBe(200);
      const response_body = await response.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "uniqueemail1",
        email: "uniqueemail2@curso.dev",
        password: response_body.password,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(uuid_version(response_body.id)).toBe(4);
      expect(Date.parse(response_body.created_at)).not.toBeNaN();
      expect(Date.parse(response_body.updated_at)).not.toBeNaN();
      expect(response_body.updated_at > response_body.created_at).toBe(true);
    });

    test("With unique 'password'", async () => {
      const user1Response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "newpassword1",
          email: "newpassword1@curso.dev",
          password: "senha123",
        }),
      });
      expect(user1Response.status).toBe(201);
      const response = await fetch(
        "http://localhost:3000/api/v1/users/newpassword1",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "newpassword2",
          }),
        },
      );
      expect(response.status).toBe(200);
      const response_body = await response.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "newpassword1",
        email: "newpassword1@curso.dev",
        password: response_body.password,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(uuid_version(response_body.id)).toBe(4);
      expect(Date.parse(response_body.created_at)).not.toBeNaN();
      expect(Date.parse(response_body.updated_at)).not.toBeNaN();
      expect(response_body.updated_at > response_body.created_at).toBe(true);
      const userInDatabase = await user.findOneByUsername("newpassword1");

      const correctPasswordMatch = await password.compare(
        "newpassword2",
        userInDatabase.password,
      );
      const incorrectPasswordMatch = await password.compare(
        "newpassword1",
        userInDatabase.password,
      );
      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });
  });
});
