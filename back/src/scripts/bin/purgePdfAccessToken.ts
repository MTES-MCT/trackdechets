#!/usr/bin/env ts-node
import prisma from "../../prisma";

// delete expired and unused pdfAccesTokens
(async function () {
  await prisma.pdfAccessToken.deleteMany({
    where: { expiresAt: { lt: new Date() }, visitedAt: null }
  });
})();
