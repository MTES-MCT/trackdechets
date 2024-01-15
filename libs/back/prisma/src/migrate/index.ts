import path from "path";
import { Pool } from "pg";
import { migrate } from "postgres-migrations";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

migrate({ client: pool }, path.join(__dirname, "migrations"))
  .then(() => console.log("Migration successful"))
  .finally(() => pool.end());
