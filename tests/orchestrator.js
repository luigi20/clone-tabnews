import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator.js";
import user from "models/user.js";
import { faker } from "@faker-js/faker";
import session from "models/session.js";
import activation from "models/activation";

const email_http_url = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}/`;
async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();
  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 5000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (response.status !== 200) {
        throw Error();
      }
      const response_body = await response.json();
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(email_http_url);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

function extractUUID(text) {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

async function createUser(user_object) {
  return await user.create({
    username:
      user_object?.username ||
      faker.internet
        .username()
        .replace("_", "")
        .replace(".", "")
        .replace("-", ""),
    email: user_object?.email || faker.internet.email(),
    password: user_object?.password || "validPassword",
    features: user_object?.features || [],
  });
}

async function create_session(user_id) {
  return await session.create(user_id);
}

async function delete_all_email() {
  await fetch(`${email_http_url}/messages`, {
    method: "DELETE",
  });
}

async function get_last_email() {
  const email_list_response = await fetch(`${email_http_url}/messages`);
  const email_list_body = await email_list_response.json();
  const last_email_item = email_list_body.pop();
  if (!last_email_item) return null;
  const email_text_response = await fetch(
    `${email_http_url}/messages/${last_email_item.id}.plain`,
  );
  const email_text_body = await email_text_response.text();
  last_email_item.text = email_text_body;
  return last_email_item;
}

async function activate_user(inactive_user) {
  return await activation.activateUserByUserId(inactive_user.id);
}

async function addFeaturesToUser(user_object, features) {
  const updated_user = await user.addFeatures(user_object.id, features);
  return updated_user;
}
const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  create_session,
  delete_all_email,
  get_last_email,
  extractUUID,
  activate_user,
  addFeaturesToUser,
};
export default orchestrator;
