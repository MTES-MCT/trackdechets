import prisma from "../../prisma";
import { indexBsda } from "../../bsda/elastic";
import { indexBsdasri } from "../../bsdasris/elastic";
import { indexBsff } from "../../bsffs/elastic";
import { indexBsvhu } from "../../bsvhu/elastic";
import { indexForm } from "../../forms/elastic";
import { getFullForm } from "../../forms/database";
import { deleteBsd, client, index } from "../../common/elastic";

async function findBsd(id) {
  return client.search({
    index: index.alias,
    body: {
      query: {
        match: {
          readableId: {
            query: id,
            operator: "and"
          }
        }
      }
    }
  });
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
  if (bsdId.startsWith("BSDA-")) {
    const bsda = await prisma.bsda.findFirst({
      where: { id: bsdId, isDeleted: false }
    });
    if (!!bsda) {
      await indexBsda(bsda);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }

  if (bsdId.startsWith("DASRI-")) {
    const bsdasri = await prisma.bsdasri.findFirst({
      where: { id: bsdId, isDeleted: false }
    });

    if (!!bsdasri) {
      await indexBsdasri(bsdasri);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }

  if (bsdId.startsWith("FF-")) {
    const bsff = await prisma.bsff.findFirst({
      where: { id: bsdId, isDeleted: false }
    });

    if (!!bsff) {
      await indexBsff(bsff);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }

  if (bsdId.startsWith("VHU-")) {
    const bsvhu = await prisma.bsvhu.findFirst({
      where: { id: bsdId, isDeleted: false }
    });

    if (!!bsvhu) {
      await indexBsvhu(bsvhu);
    } else {
      await deleteBsd({ id: bsdId });
    }
    return;
  }

  if (bsdId.startsWith("BSD-") || bsdId.startsWith("TD-")) {
    const bsdd = await prisma.form.findFirst({
      where: { readableId: bsdId, isDeleted: false }
    });
    if (!!bsdd) {
      const fullBsdd = await getFullForm(bsdd);
      await indexForm(fullBsdd);
    } else {
      // bsd was not found in db, let's find it in ES and get its db ID
      const res = await findBsd(bsdId);
      const indexedId = res?.body?.hits?.hits[0]?._id;
      if (!!indexedId) {
        await deleteBsd({ id: indexedId });
      }
    }
    return;
  }
  console.log("L'argument ne correspond pas à un ID ou readableId de bsd");
})();
