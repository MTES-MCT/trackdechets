import { prisma } from "@td/prisma";
import { hashToken } from "../../utils";
import * as readline from "readline";
export async function hashTokens() {
  const tokens = await prisma.accessToken.findMany();

  let counter = 0;
  for (const token of tokens) {
    if (token.token.length <= 40) {
      // hashed tokens length is longer
      counter += 1;
      await prisma.accessToken.update({
        data: { token: hashToken(token.token) },
        where: {
          id: token.id
        }
      });
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`Hashing token ${counter}  `);
    }
  }
}
