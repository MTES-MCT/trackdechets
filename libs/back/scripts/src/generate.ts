import { writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

function generateScript() {
  const scriptName = process.argv[2];

  if (!scriptName) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Script name: ", name => {
      rl.close();
      createScript(name);
    });
  } else {
    createScript(scriptName);
  }
}

function createScript(name: string) {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  const scriptName = `${timestamp}_${name}`;

  const scriptTemplate = `import { Prisma } from "@prisma/client";

export async function run(tx: Prisma.TransactionClient) {
  // Script logic goes here...
}
`;

  const scriptPath = join(__dirname, "scripts", `${scriptName}.ts`);

  if (existsSync(scriptPath)) {
    throw new Error(`❌ Script file already exists: ${scriptPath}`);
  }
  writeFileSync(scriptPath, scriptTemplate);

  console.info(`✅ Migration file created: ${scriptPath}`);
}

generateScript();
