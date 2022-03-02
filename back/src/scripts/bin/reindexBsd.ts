import prisma from "../../prisma";
import { indexBsda } from "../../bsda/elastic";
import { indexBsdasri } from "../../bsdasris/elastic";
import { indexBsff } from "../../bsffs/elastic";
import { indexBsvhu } from "../../bsvhu/elastic";
import { indexForm } from "../../forms/elastic";
import { getFullForm } from "../../forms/database";
import { deleteBsd } from "../../common/elastic";

(async function() {
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
  if (bsdId.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findUnique({ where: { id: bsdId } });
    if (!!bsda) {
      await indexBsda(bsda);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findUnique({ where: { id: bsdId } });
    console.log(bsdasri);
    if (!!bsdasri) {
      await indexBsdasri(bsdasri);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findUnique({ where: { id: bsdId } });
    console.log(bsff);
    if (!!bsff) {
      await indexBsff(bsff);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await prisma.bsvhu.findUnique({ where: { id: bsdId } });
    console.log(bsvhu);
    if (!!bsvhu) {
      await indexBsvhu(bsvhu);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }

  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    const bsdd = await prisma.form.findUnique({
      where: { readableId: bsdId }
    });
    if (!!bsdd) {
      const fullBsdd = await getFullForm(bsdd);
      await indexForm(fullBsdd);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }
  console.log("L'argument ne correspond pas à un ID ou readableId de bsd");
})();
