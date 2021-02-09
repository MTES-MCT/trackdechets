import prisma from "../../prisma";
import { hashToken } from "../../utils";

export async function hashTokens() {
  const tokens = await prisma.accessToken.findMany();

  for (const token of tokens) {
    if (token.token.length > 40) {
      await prisma.accessToken.update({
        data: { token: hashToken(token.token) },
        where: {
          id: token.id
        }
      });
    }
  }
}
