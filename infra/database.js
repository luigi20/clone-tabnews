import { Client } from "pg";
import { ServiceError } from "./errors.js";

async function query(query_object) {
  let client;
  try {
    client = await getNewClient();
    const result = await client.query(query_object);
    return result;
  } catch (error) {
    console.log("oiiiiiii");
    const serviceErrorObject = new ServiceError({
      message: "Erro na conexão com Banco ou na Query.",
      cause: error,
    });

    throw serviceErrorObject;
  } finally {
    await client?.end();
  }
}

async function getNewClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DATABASE,
    ssl: process.env.NODE_ENV === "production" ? true : false,
  });
  await client.connect();
  return client;
}

const database = { query, getNewClient };
export default database;
