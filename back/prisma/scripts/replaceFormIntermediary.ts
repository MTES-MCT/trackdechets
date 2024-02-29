import path from "path";
import { prisma } from "@td/prisma";
import { logger } from "@td/logger";
import { Prisma } from "@prisma/client";
import { getFormRepository } from "../../src/forms/repository";
import { registerUpdater, Updater } from "./helper/helper";

async function updateFormIntermediaries(
  bsdReadableId: string,
  addSiret: string,
  deleteSiret: string
) {
  if (!bsdReadableId || !addSiret || !deleteSiret) {
    return;
  }
  let form;
  try {
    form = await prisma.form.findUniqueOrThrow({
      where: {
        readableId: bsdReadableId
      },
      select: { id: true }
    });
  } catch (err) {
    return;
  }
  const [formIntermediary] = await prisma.intermediaryFormAssociation.findMany({
    where: {
      formId: form.id,
      siret: deleteSiret
    }
  });
  if (!formIntermediary) {
    return;
  }
  const newFormInput: Prisma.FormUpdateInput = {
    intermediaries: {
      delete: { id: formIntermediary.id },
      create: [
        {
          name: "CYCLEVIA",
          contact: "directeur CYCLEVIA",
          siret: addSiret,
          address:
            "4 RUE JACQUES DAGUERRE IMMEUBLE CONCORDE 92500 RUEIL-MALMAISON"
        }
      ]
    }
  };
  // Passe par la méthode update du form repository pour logguer l'event, déclencher le réindex
  const user = { id: "support-td", authType: "script" };
  const { update } = getFormRepository(user as any);
  try {
    await update({ id: form.id }, newFormInput);
    logger.info(
      `Mis à jour terminée du BSDD ${form.id}, suppression ${deleteSiret} et ajout ${addSiret}`
    );
  } catch (err) {
    logger.error(`Error during update`, err);
    throw err;
  }
}

@registerUpdater(
  "Update Chimirec CYCLEVIA intermediary",
  "The script replace an intermediary for a list of BSDD",
  true
)
export class LoadAnonymousCompaniesUpdater implements Updater {
  async run() {
    let data;
    try {
      // the replaceFormIntermediary.json file may not exist and TypeScript would prevent us
      // from importing it with a regular import
      // that's why we're using a dynamic import with path.join(),
      // so TypeScript loses track of what's being imported
      data = await import(path.join(__dirname, "replaceFormIntermediary.json"));
    } catch (err) {
      logger.error(
        "Missing file ./replaceFormIntermediary.json, aborting script"
      );
      process.exit(1);
    }
    const options = {
      add: "90377711800022",
      delete: "50951435200046"
    };
    for (const bsdReadableId of data.default) {
      await Promise.allSettled([
        updateFormIntermediaries(
          bsdReadableId["initialFormId"],
          options.add,
          options.delete
        ),
        updateFormIntermediaries(
          bsdReadableId["nextFormId"],
          options.add,
          options.delete
        )
      ]);
    }
  }
}
