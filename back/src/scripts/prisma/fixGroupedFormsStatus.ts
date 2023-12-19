import { processDbIdentifiersByChunk } from "../../bsds/indexation/bulkIndexBsds";
import { getFormRepository } from "../../forms/repository";
import { FormForUpdateAppendix2FormsInclude } from "../../forms/repository/form/updateAppendix2Forms";
import { prisma } from "@td/prisma";

export async function fixedGroupedFormsStatus() {
  const formIds = await prisma.form.findMany({
    where: {
      groupedIn: { some: {} },
      forwardedInId: { not: null },
      status: { in: ["AWAITING_GROUP", "GROUPED"] }
    },
    select: { id: true }
  });

  // ~ 6000 bordereaux
  console.log(
    `Mise à jour du statut de ${formIds.length} bordereaux avec` +
      ` entreposage provisoire annexés à des bordereaux de regroupement`
  );

  await processDbIdentifiersByChunk(
    formIds.map(f => f.id),
    async ids => {
      const forms = await prisma.form.findMany({
        where: { id: { in: ids } },
        include: FormForUpdateAppendix2FormsInclude
      });

      const { updateAppendix2Forms } = getFormRepository({
        id: "support_tech"
      } as Express.User);

      await updateAppendix2Forms(forms);
    },
    100 // process les bordereaux 100 par 100
  );
}
