import path from "path";
import { migrate } from "postgres-migrations";

const dbConfig = {
  database: "prisma",
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10)
};

migrate(dbConfig, path.join(__dirname, "migrations"))
  .then(() => console.log("Migration successful"))
  .catch(err => console.error(err));
