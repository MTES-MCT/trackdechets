import { processDbIdentifiersByChunk } from "../../bsds/indexation/bulkIndexBsds";
import { prisma } from "@td/prisma";
import { updateAppendix2Fn } from "../../forms/updateAppendix2";

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
      for (const id of ids) {
        await updateAppendix2Fn({ formId: id }, true);
      }
    },
    100 // process les bordereaux 100 par 100
  );
}
