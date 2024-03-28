import { Decimal } from "decimal.js";
import { prisma } from "@td/prisma";
import { processDbIdentifiersByChunk } from "../../bsds/indexation/bulkIndexBsds";

export async function addQuantityGrouped() {
  // Récupère l'ensemble des bordereaux annexés à un bordereau
  // de groupement. Cela représente environ 75000 bordereaux
  // On récupère uniquement les identifiants dans un premier temps
  const groupedFormIds = await prisma.form.findMany({
    where: { groupedIn: { some: {} } },
    select: { id: true }
  });

  const total = groupedFormIds.length;

  console.log(
    `Il y a ${total} bordereaux annexés à des bordereaux de groupement\n` +
      `Mettons à jour le champ quantityGrouped...`
  );

  let i = 0;

  // puis on récupère les infos du groupement et on met à jour la quantité
  // regroupé chunk par chunk
  async function processChunk(formIds: string[]) {
    const groupedForms = await prisma.form.findMany({
      where: { id: { in: formIds } },
      include: { groupedIn: { select: { quantity: true } } }
    });
    const quantitGroupedByFormId: { [key: string]: number } = {};
    for (const groupedForm of groupedForms) {
      // Calcule la quantité regroupée en itérant sur tous les bordereaux
      // de groupement (il peut y en avoir plusieurs en cas de scission)
      const quantityGrouped = groupedForm.groupedIn.reduce(
        (counter, formGroupement) => {
          return counter.plus(formGroupement.quantity);
        },
        new Decimal(0)
      );
      quantitGroupedByFormId[groupedForm.id] = quantityGrouped.toNumber();
      i = i + formIds.length;
      if (i % 10000 === 0) {
        const progress = (i / total) * 100;
        console.log(`Job completed : ${progress}%`);
      }
    }

    // Met à jour le champ `quantityGrouped`
    await Promise.all(
      formIds.map(formId =>
        prisma.form.update({
          where: { id: formId },
          data: { quantityGrouped: quantitGroupedByFormId[formId] }
        })
      )
    );
  }

  await processDbIdentifiersByChunk(
    groupedFormIds.map(f => f.id),
    processChunk,
    100 // process les bordereaux 100 par 100
  );
}
