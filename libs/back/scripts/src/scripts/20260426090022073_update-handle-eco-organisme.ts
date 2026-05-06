import { Prisma } from "@td/prisma";

export async function run(tx: Prisma.TransactionClient) {
  const SIRET = "92474564900021";

  console.log(`>> Updating handleBsdd=true for siret ${SIRET}...`);

  const eco = await tx.ecoOrganisme.findUnique({
    where: { siret: SIRET }
  });

  if (!eco) {
    console.log(`Aucun eco-organisme trouvé pour le siret ${SIRET}`);
    return;
  }

  await tx.ecoOrganisme.update({
    where: { siret: SIRET },
    data: { handleBsdd: true }
  });

  console.log(`Updated ${eco.name} (siret=${eco.siret}) handleBsdd=true`);

  console.log("Terminé!");
}
