import { prisma } from "@td/prisma";
import { closeQueues } from "../../queue/producers";
import { reindex } from "../../bsds/indexation/reindexBsdHelpers";

async function exitScript(success?: boolean) {
  await prisma.$disconnect();
  console.log(
    success
      ? "Done, exiting"
      : "L'argument ne correspond pas à un ID ou readableId de bsd"
  );
  await closeQueues();
}

(async function () {
  const bsdId: string = process.argv[2];
  if (!bsdId) {
    console.log(
      [
        "Ce script permet de mettre à jour l'indexation d'un BSD donné.",
        "",
        "Il accepte un argument: pour les BSDD l'identifiant lisible, pour les autres l'ID du BSD concerné.",
        "Si aucun BSD n'est trouvé en DB, il est supprimé de l'index ES."
      ].join("\n")
    );
    return;
  }

  return reindex(bsdId, exitScript);
})();
