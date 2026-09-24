import orchestrator from "tests/orchestrator.js";
import { version as uuid_version } from "uuid";
import setCookieParser from "set-cookie-parser";
import session from "models/session.js";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("Delete /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With nonexistent session", async () => {
      const not_token =
        "5ce1aac69d4a1383509864ac73015ee943b7399aa3bd909b1fd97007a16f0e53c8c3261c1e306ef147ec7e5589a14931";
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${not_token}`,
        },
      });
      expect(response.status).toBe(401);
      const response_body = await response.json();
      expect(response_body).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.expiration_in_milliseconds),
      });
      const create_user = await orchestrator.createUser({
        username: "UserWithExpiredSession",
      });
      const session_object = await orchestrator.create_session(create_user.id);
      jest.useRealTimers();
      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${session_object.token}`,
        },
      });
      expect(response.status).toBe(401);
      const response_body = await response.json();
      expect(response_body).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });

    test("With valid session", async () => {
      const createdUser = await orchestrator.createUser();

      const sessionObject = await orchestrator.create_session(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/sessions", {
        method: "DELETE",
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: sessionObject.id,
        token: sessionObject.token,
        user_id: sessionObject.user_id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuid_version(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(
        responseBody.expires_at < sessionObject.expires_at.toISOString(),
      ).toBe(true);
      expect(
        responseBody.updated_at > sessionObject.updated_at.toISOString(),
      ).toBe(true);

      // Set-Cookie assertions
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });

      // Double check assertions
      const doubleCheckResponse = await fetch(
        "http://localhost:3000/api/v1/users",
        {
          headers: {
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(doubleCheckResponse.status).toBe(401);

      const doubleCheckResponseBody = await doubleCheckResponse.json();

      expect(doubleCheckResponseBody).toEqual({
        name: "UnauthorizedError",
        message: "Usuário não possui sessão ativa.",
        action: "Verifique se este usuário está logado e tente novamente.",
        status_code: 401,
      });
    });
  });
});
