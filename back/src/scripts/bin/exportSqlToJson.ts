import { Command } from "commander";
import { Client } from "pg";
import fs from "fs";

const program = new Command();

program
  .command("query <sql_command>")
  .option("-h, --host <host>", "Database hostname", "localhost")
  .option("-U, --username <username>", "Database username")
  .option("-W, --password <password>", "Database password")
  .option("-d, --dbname <dbname>", "Database name")
  .option("-p, --port <port>", "Database port", "5432")
  .option(
    "-o, --output <output>",
    "Output file path for JSON data",
    "results.json"
  )
  .action(async (sqlCommand, options) => {
    const client = new Client({
      user: options.username,
      host: options.host,
      database: options.dbname,
      password: options.password,
      port: options.port
    });

    try {
      await client.connect();
      const { rows } = await client.query(sqlCommand);
      const jsonData = JSON.stringify(rows, null, 2);
      await fs.promises.writeFile(options.output, jsonData, "utf8");
      console.log(`Data saved to ${options.output}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    } finally {
      await client.end();
    }
  });

program.parse(process.argv);
