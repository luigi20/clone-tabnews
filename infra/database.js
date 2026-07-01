import { Client } from "pg";

async function query(query_object) {
  const teste = process.env.POSTGRES_PASSWORD;
  console.log(teste);
  console.log({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DATABASE,
  });
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DATABASE,
  });
  await client.connect();
  const result = await client.query(query_object);
  await client.end();
  return result;
}

export default {
  query,
};
