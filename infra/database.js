import { Client } from "pg";

async function query(query_object) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DATABASE,
    ssl: process.env.NODE_ENV === "development" ? false : true,
  });

  try {
    await client.connect();
    const result = await client.query(query_object);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  } finally {
    await client.end();
  }
}

export default {
  query,
};
