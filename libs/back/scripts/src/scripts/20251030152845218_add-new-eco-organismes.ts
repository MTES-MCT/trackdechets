import { prisma } from "@td/prisma";

// Add 5 new eco-organismes for VHU handling
// Based on objects added in libs/back/object-creator/src/objects.ts

export async function run() {
  console.log(">> Adding 5 new eco-organismes for VHU handling...");

  const ecoOrganismes = [
    {
      siret: "32836885700020",
      name: "AIXAM MEGA",
      address: "56 ROUTE DE PUGNY 73100 AIX-LES-BAINS",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    },
    {
      siret: "39391874300062",
      name: "HARLEY-DAVIDSON FRANCE",
      address: "EUROPARC 12 RUE EUGENE DUPUIS 94000 CRETEIL",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    },
    {
      siret: "38391529500083",
      name: "KIA FRANCE",
      address: "2 RUE DES MARTINETS 92500 RUEIL-MALMAISON",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    },
    {
      siret: "44451198400031",
      name: "MIDI FRANCE",
      address: "6 RUE JEAN-PIERRE TIMBAUD 78180 MONTIGNY-LE-BRETONNEUX",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    },
    {
      siret: "31022749100159",
      name: "PIAGGIO FRANCE",
      address: "21 RUE GEORGES BOISSEAU 92110 CLICHY",
      handleBsdd: false,
      handleBsdasri: false,
      handleBsda: false,
      handleBsvhu: true
    }
  ];

  let upserted = 0;
  let errors = 0;

  console.log(`Processing ${ecoOrganismes.length} eco-organismes...`);

  for (const eo of ecoOrganismes) {
    try {
      const result = await prisma.ecoOrganisme.upsert({
        where: { siret: eo.siret },
        create: eo,
        update: eo
      });

      console.log(
        `✅ Upserted ${result.name} (siret=${result.siret}) id=${result.id}`
      );
      upserted++;
    } catch (err) {
      errors++;
      console.error(
        `❌ Failed to upsert ${eo.name} (${eo.siret}):`,
        err.message || err
      );
    }
  }

  console.log("\n=== RÉSUMÉ FINAL ===");
  console.log(`${upserted} eco-organismes traités, ${errors} erreurs`);

  if (errors === 0) {
    console.log("✅ Tous les eco-organismes ont été ajoutés avec succès!");
  }

  console.log("Terminé!");
}
