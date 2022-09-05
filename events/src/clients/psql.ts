import { Client } from "pg";
import { TDEvent } from "../types";

const { DATABASE_URL } = process.env;
const TABLE = '"default$default"."Event"';

let psqlClient: Client;

async function getPsqlClient() {
  if (psqlClient) {
    return psqlClient;
  }

  psqlClient = new Client({ connectionString: DATABASE_URL });
  await psqlClient.connect();
  return psqlClient;
}

export async function closePsqlClient() {
  if (!psqlClient) return Promise.resolve();

  return psqlClient.end();
}

export async function getOldestEvents(count: number = 100) {
  const client = await getPsqlClient();
  const rawResults = await client.query<TDEvent>(
    `SELECT * FROM ${TABLE} ORDER BY id ASC LIMIT ${count}`
  );

  return { events: rawResults.rows, count: rawResults.rowCount };
}

export async function deleteEvents(ids: string[]) {
  const client = await getPsqlClient();
  return client.query(
    `DELETE FROM ${TABLE} WHERE id IN (${ids.map(id => `'${id}'`).join(", ")})`
  );
}
