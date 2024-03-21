import { Updater, registerUpdater } from "./helper/helper";
import { prisma } from "@td/prisma";
import { EmitterType, Prisma } from "@prisma/client";
import { enqueueBsdToDelete } from "../../src/queue/producers/elastic";

@registerUpdater(
  "Remove orphans APPENDIX1_PRODUCER from ES",
  "An orphan APPENDIX1_PRODUCER should not appear in the dashboard",
  true
)
export class UnindexOrphanAppendix1 implements Updater {
  async run() {
    try {
      const CHUNK_SIZE = 200;

      const where: Prisma.FormWhereInput = {
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        groupedIn: { none: {} }
      };

      const orphansCount = await prisma.form.count({ where });

      let cursor: string | null = null;
      for (let i = 0; i < orphansCount; i += CHUNK_SIZE) {
        const orphansChunk = await prisma.form.findMany({
          where,
          orderBy: { id: "asc" },
          take: CHUNK_SIZE,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
        });

        cursor = orphansChunk[orphansChunk.length - 1].id;

        const orphanIds = orphansChunk.map(form => form.id);

        for (const id of orphanIds) {
          enqueueBsdToDelete(id);
        }
      }
    } catch (err) {
      console.error(
        "☠ Something went wrong during the un-indexation of orphans APPENDIX1_PRODUCER",
        err
      );
      throw new Error();
    }
  }
}
