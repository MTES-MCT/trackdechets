import { AuthType, EmitterType, Status } from "@prisma/client";
import { sub } from "date-fns";
import { deleteBsd, prisma } from "back";

/**
 * After you sign the first appendix1 on a container, you have 3 days to sign the rest.
 * We count 3 days starting from the day of the first signature at 00:00.
 * After those 3 days, the unsigned appendix1 are automatically deleted.
 */
export async function cleanUnusedAppendix1ProducerBsdds() {
  const now = new Date();
  // Take the current date at 00:00 and substract 2 days.
  // This is
  const limitDate = sub(now, {
    days: 2,
    hours: now.getHours(),
    minutes: now.getMinutes()
  });

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
