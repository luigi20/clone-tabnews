import orchestrator from "tests/orchestrator.js";
import activation from "models/activation.js";
import webserver from "infra/webserver.js";
import user from "models/user.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.delete_all_email();
});

describe("Use case: Registration Flow (all successful", () => {
  let create_user_response_body;
  let activation_token_id;
  let create_session_response_body;
  test("Create user account", async () => {
    const create_user_response = await fetch(
      "http://localhost:3000/api/v1/users",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "registration.flow@curso.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );
    expect(create_user_response.status).toBe(201);
    create_user_response_body = await create_user_response.json();
    expect(create_user_response_body).toEqual({
      id: create_user_response_body.id,
      username: "RegistrationFlow",
      features: ["read:activation_token"],
      password: create_user_response_body.password,
      created_at: create_user_response_body.created_at,
      updated_at: create_user_response_body.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const last_email = await orchestrator.get_last_email();
    expect(last_email.sender).toBe("<contato@finsetabnews.com.br>");
    expect(last_email.recipients[0]).toBe("<registration.flow@curso.dev>");
    expect(last_email.subject).toBe("Ative seu cadastro no FinTab!");
    expect(last_email.text).toContain("RegistrationFlow");
    activation_token_id = orchestrator.extractUUID(last_email.text);
    expect(last_email.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activation_token_id}`,
    );
    const activation_token_object =
      await activation.findOneValidById(activation_token_id);
    expect(activation_token_object.user_id).toBe(create_user_response_body.id);
    expect(activation_token_object.used_at).toBe(null);
  });

  test("Activate account", async () => {
    const activation_response = await fetch(
      `http://localhost:3000/api/v1/activations/${activation_token_id}`,
      {
        method: "PATCH",
      },
    );
    expect(activation_response.status).toBe(201);
    const activation_response_body = await activation_response.json();
    expect(Date.parse(activation_response_body.used_at)).not.toBeNaN();
    const activated_user = await user.findOneByUsername("RegistrationFlow");
    expect(activated_user.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const create_sessions_response = await fetch(
      "http://localhost:3000/api/v1/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "registration.flow@curso.dev",
          password: "RegistrationFlowPassword",
        }),
      },
    );
    expect(create_sessions_response.status).toBe(201);
    create_session_response_body = await create_sessions_response.json();
    expect(create_session_response_body.user_id).toBe(
      create_user_response_body.id,
    );
  });

  test("Get user information", async () => {
    const userResponse = await fetch(`${webserver.origin}/api/v1/users`, {
      headers: {
        cookie: `session_id=${create_session_response_body.token}`,
      },
    });

    expect(userResponse.status).toBe(200);

    const userResponseBody = await userResponse.json();

    expect(userResponseBody.id).toBe(create_user_response_body.id);
  });
});
