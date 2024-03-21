import { AuthType, EmitterType, Prisma, Status } from "@prisma/client";
import { subDays, startOfDay } from "date-fns";
import { deleteBsd } from "back";
import { prisma } from "@td/prisma";

export async function cleanAppendix1() {
  await cleanUnsignedAppendix1();
  await cleanOrphanAppendix1();
}

/**
 * Once you sign the first appendix1 on a container, you have 5 days to sign the rest.
 * We count 5 days starting from the day of the first signature at 00:00.
 * After those 5 days, the unsigned appendix1 are automatically deleted.
 */
async function cleanUnsignedAppendix1() {
  // Take the current date at 00:00 and substract 4 days. That gives 4 + current day = 5 days.
  const limitDate = startOfDay(subDays(new Date(), 4));

  const activeAppendix1ContainerSignedBeforeLimit = await prisma.form.findMany({
    where: {
      emitterType: EmitterType.APPENDIX1,
      status: Status.SENT,
      AND: [
        {
          grouping: {
            some: { initialForm: { takenOverAt: { lte: limitDate } } }
          }
        },
        { grouping: { some: { initialForm: { takenOverAt: null } } } }
      ]
    },
    select: {
      grouping: { include: { initialForm: { select: { status: true } } } }
    }
  });

  const appendix1ProducerIds =
    activeAppendix1ContainerSignedBeforeLimit.flatMap(form =>
      form.grouping
        .filter(g => g.initialForm.status === "SEALED")
        .map(g => g.initialFormId)
    );

  await prisma.form.updateMany({
    where: {
      id: { in: appendix1ProducerIds },
      status: Status.SEALED
    },
    data: {
      isDeleted: true
    }
  });

  for (const id in appendix1ProducerIds) {
    await deleteBsd({ id }, { user: { auth: AuthType.BEARER } } as any);
  }

  await prisma.formGroupement.deleteMany({
    where: { initialFormId: { in: appendix1ProducerIds } }
  });
}

/**
 * Auto clean orphan APPENDIX1_PRODUCER forms.
 * An APPENDIX1_PRODUCER form created more than 10 days ago and not grouped to a container is automatically deleted.
 */
async function cleanOrphanAppendix1() {
  const CHUNK_SIZE = 200;
  const limitDate = startOfDay(subDays(new Date(), 10));

  const where: Prisma.FormWhereInput = {
    emitterType: EmitterType.APPENDIX1_PRODUCER,
    createdAt: { lte: limitDate },
    isDeleted: false,
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

    await prisma.form.updateMany({
      where: { id: { in: orphansChunk.map(form => form.id) } },
      data: { isDeleted: true }
    });
  }
}
