import { prisma } from "@td/prisma";
import { aesEncrypt } from "../../src/utils";

const INSEE_PASSWORD_CREDENTIAL_KEY = "insee_password";

async function readPasswordFromCli(): Promise<string> {
  const positionalPassword = process.argv[2];
  if (positionalPassword) {
    return positionalPassword;
  }

  return await new Promise<string>((resolve, reject) => {
    const stdin = process.stdin;

    stdin.resume();
    stdin.setEncoding("utf8");

    let data = "";
    stdin.on("data", chunk => {
      data += chunk;
    });

    stdin.on("end", () => {
      const password = data.trim();
      if (!password) {
        reject(
          new Error(
            "Le mot de passe INSEE est requis. Merci de le fournir en argument ou via stdin. L'application ne lit plus le mot de passe depuis les variables d'environnement."
          )
        );
        return;
      }

      resolve(password);
    });

    stdin.on("error", error => {
      reject(error);
    });
  });
}

async function main() {
  const password = await readPasswordFromCli();

  const passwordChangedAt = new Date();

  const credential = await prisma.inseePasswordCredential.upsert({
    where: { key: INSEE_PASSWORD_CREDENTIAL_KEY },
    create: {
      key: INSEE_PASSWORD_CREDENTIAL_KEY,
      encryptedPassword: aesEncrypt(password),
      passwordChangedAt
    },
    update: {
      encryptedPassword: aesEncrypt(password),
      passwordChangedAt
    }
  });

  console.log(
    JSON.stringify({
      ok: true,
      source: "database",
      credentialUpdated: true
    })
  );
}

main().catch(error => {
  console.error(
    "Erreur lors du chargement du mot de passe INSEE en base",
    error
  );
  process.exit(1);
});
