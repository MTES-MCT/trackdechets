import { prisma } from "@td/prisma";
import { AuthType, EmitterType, Prisma } from "@prisma/client";
import { logger } from "@td/logger";
import { deleteBsd } from "../../common/elastic";
import { closeQueues } from "../../queue/producers";

async function exitScript() {
  logger.info("Done reindexAllInBulk script, exiting");
  await prisma.$disconnect();
  await closeQueues();
  process.exit(0);
}

// ensure deleted orphans appendix1 are removed from ES
(async function () {
  const CHUNK_SIZE = 200;

  const where: Prisma.FormWhereInput = {
    emitterType: EmitterType.APPENDIX1_PRODUCER,
    isDeleted: true,
    groupedIn: { none: {} }
  };
  const orphansCount = await prisma.form.count({ where });

  let cursor: string | null = null;

  for (let i = 0; i < orphansCount; i += CHUNK_SIZE) {
    console.log(`Chunk ${i + 1}`);

    const orphans = await prisma.form.findMany({
      where,
      orderBy: { id: "asc" },
      take: CHUNK_SIZE,
      select: { id: true },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    });

    cursor = orphans[orphans.length - 1].id;

    const orphansIds = orphans.map(form => form.id);

    for (const id of orphansIds) {
      console.log(`Removing ${id}`);
      await deleteBsd({ id }, { user: { auth: AuthType.BEARER } } as any);
    }
  }

  await exitScript();
})();
