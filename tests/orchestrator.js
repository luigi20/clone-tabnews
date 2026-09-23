import retry from "async-retry";
import database from "infra/database";
import migrator from "models/migrator.js";
import user from "models/user.js";
import { faker } from "@faker-js/faker";
import session from "models/session.js";
async function waitForAllServices() {
  await waitForWebServer();

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
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
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
  });
}

async function create_session(user_id) {
  return await session.create(user_id);
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  create_session,
};
export default orchestrator;
