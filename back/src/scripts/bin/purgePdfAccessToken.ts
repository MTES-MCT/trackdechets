#!/usr/bin/env ts-node
import { prisma } from "@td/prisma";

// delete expired and unused pdfAccesTokens
(async function () {
  await prisma.pdfAccessToken.deleteMany({
    where: { expiresAt: { lt: new Date() }, visitedAt: null }
  });
})();
