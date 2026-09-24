import orchestrator from "tests/orchestrator.js";
import { version as uuid_version } from "uuid";
import setCookieParser from "set-cookie-parser";
import session from "models/session.js";
beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const create_user = await orchestrator.createUser({
        username: "UserWithValidSession",
      });
      const session_object = await orchestrator.create_session(create_user.id);
      const response = await fetch("http://localhost:3000/api/v1/users", {
        headers: {
          Cookie: `session_id=${session_object.token}`,
        },
      });
      expect(response.status).toBe(200);
      const cache_control = response.headers.get("Cache-Control");
      expect(cache_control).toBe(
        "no-store, no-cacje, max-age=0, must-revalidate",
      );
      const response_body = await response.json();
      expect(response_body).toEqual({
        id: response_body.id,
        username: "UserWithValidSession",
        email: create_user.email,
        password: create_user.password,
        created_at: create_user.created_at.toISOString(),
        updated_at: create_user.updated_at.toISOString(),
      });
      expect(uuid_version(response_body.id)).toBe(4);
      expect(Date.parse(response_body.created_at)).not.toBeNaN();
      expect(Date.parse(response_body.updated_at)).not.toBeNaN();
      const renewed_session_object = await session.findOneValidByToken(
        session_object.token,
      );
      expect(
        renewed_session_object.expires_at > session_object.expires_at,
      ).toEqual(true);
      expect(
        renewed_session_object.updated_at > session_object.updated_at,
      ).toEqual(true);
      const parsed_set_cookie = setCookieParser(response, {
        map: true,
      });
      expect(parsed_set_cookie.session_id).toEqual({
        name: "session_id",
        value: renewed_session_object.token,
        maxAge: session.expiration_in_milliseconds / 1000,
        path: "/",
        httpOnly: true,
      });
    });

    test("With nonexistent session", async () => {
      const not_token =
        "5ce1aac69d4a1383509864ac73015ee943b7399aa3bd909b1fd97007a16f0e53c8c3261c1e306ef147ec7e5589a14931";
      const response = await fetch("http://localhost:3000/api/v1/users", {
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
      const response = await fetch("http://localhost:3000/api/v1/users", {
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
    });

    test("With halftime session", async () => {
      jest.useFakeTimers({
        now: new Date(
          Date.now() -
            session.expiration_in_milliseconds +
            60 * 60 * 24 * 15 * 1000,
        ),
      });
      const createdUser = await orchestrator.createUser({
        username: "UserWithHalfTimeSession",
      });

      const sessionObject = await orchestrator.create_session(createdUser.id);
      jest.useRealTimers();

      const response = await fetch(`http://localhost:3000/api/v1/users`, {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(response.status).toBe(200);
      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: createdUser.id,
        username: "UserWithHalfTimeSession",
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuid_version(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Session renewal assetion
      const renewedSessionObject = await session.findOneValidByToken(
        sessionObject.token,
      );

      expect(
        renewedSessionObject.expires_at > sessionObject.expires_at,
      ).toEqual(true);
      expect(
        renewedSessionObject.updated_at > sessionObject.updated_at,
      ).toEqual(true);

      // Set-cookie assertion
      const parsedSetCookie = setCookieParser(response, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: "session_id",
        value: sessionObject.token,
        maxAge: session.expiration_in_milliseconds / 1000,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
