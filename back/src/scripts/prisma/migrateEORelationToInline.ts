import { prisma } from "../../generated/prisma-client";

export default async function migrateEORelationToInline() {
  const forms = await prisma
    .forms({
      where: {
        ecoOrganisme: {
          id_not: null
        }
      }
    })
    .$fragment<
      Array<{ id: string; ecoOrganisme: { name: string; siret: string } }>
    >(
      `fragment FormWithEcoOrganisme on Form {
          id
          ecoOrganisme {
            name
            siret
          }
        }`
    );
  for (const form of forms) {
    await prisma.updateForm({
      data: {
        ecoOrganismeName: form.ecoOrganisme.name,
        ecoOrganismeSiret: form.ecoOrganisme.siret,

        // This relation is meant to disappear so we can disconnect it already
        ecoOrganisme: {
          disconnect: true
        }
      },
      where: {
        id: form.id
      }
    });
  }
}
