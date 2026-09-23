import orchestrator from "tests/orchestrator.js";
import { version as uuid_version } from "uuid";
import setCookieParser from "set-cookie-parser";
import session from "models/session.js";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/sessions", () => {
  describe("Anonymous user", () => {
    test("With correct `email` but incorrect `password`", async () => {
      await orchestrator.createUser({
        password: "senha-correta",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.errado@curso.dev",
          password: "senha-correta",
        }),
      });
      expect(response.status).toBe(401);
      const response_body = await response.json();
      expect(response_body).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With incorrect `email` but correct `password`", async () => {
      await orchestrator.createUser({
        email: "email.correto@curso.dev",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.correto@curso.dev",
          password: "senha-incorreta",
        }),
      });
      expect(response.status).toBe(401);
      const response_body = await response.json();
      expect(response_body).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With incorrect `email` and incorrect `password`", async () => {
      await orchestrator.createUser();
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "email.incorreto@curso.dev",
          password: "senha-incorreta",
        }),
      });
      expect(response.status).toBe(401);
      const response_body = await response.json();
      expect(response_body).toEqual({
        name: "UnauthorizedError",
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados enviados estão corretos.",
        status_code: 401,
      });
    });

    test("With correct `email` and correct `password`", async () => {
      const created_user = await orchestrator.createUser({
        email: "tudo.correto@curso.dev",
        password: "tudocorreto",
      });
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "tudo.correto@curso.dev",
          password: "tudocorreto",
        }),
      });
      const response_body = await response.json();
      expect(response.status).toBe(201);
      expect(response_body).toEqual({
        id: response_body.id,
        token: response_body.token,
        user_id: created_user.id,
        expires_at: response_body.expires_at,
        created_at: response_body.created_at,
        updated_at: response_body.updated_at,
      });
      expect(uuid_version(response_body.id)).toBe(4);
      expect(Date.parse(response_body.created_at)).not.toBeNaN();
      expect(Date.parse(response_body.updated_at)).not.toBeNaN();
      expect(Date.parse(response_body.expires_at)).not.toBeNaN();
      const expires_at = new Date(response_body.expires_at);
      const created_at = new Date(response_body.created_at);
      expires_at.setMilliseconds(0);
      created_at.setMilliseconds(0);
      expect(expires_at - created_at).toBe(session.expiration_in_milliseconds);
      const parsed_set_cookie = setCookieParser(response, {
        map: true,
      });
      expect(parsed_set_cookie.session_id).toEqual({
        name: "session_id",
        value: response_body.token,
        maxAge: session.expiration_in_milliseconds / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
