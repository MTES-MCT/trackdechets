import { FormGroupement } from "@prisma/client";
import DataLoader from "dataloader";
import prisma from "../prisma";

export function createFormDataLoaders() {
  return {
    forwardedIns: new DataLoader((formIds: string[]) =>
      getForwardedIns(formIds)
    ),
    formGoupements: new DataLoader((formIds: string[]) =>
      getFormGroupements(formIds)
    )
  };
}

async function getForwardedIns(formIds: string[]) {
  const initialForms = await prisma.form.findMany({
    where: {
      id: { in: formIds }
    },
    include: { forwardedIn: true }
  });

  return formIds.map(
    formId =>
      initialForms.find(initialForm => initialForm.id === formId)
        ?.forwardedIn ?? null
  );
}

async function getFormGroupements(formIds: string[]) {
  const groupements = await prisma.formGroupement.findMany({
    where: {
      initialFormId: { in: formIds }
    }
  });

  const groupementsGroupedByInitialFormId: { [id: string]: FormGroupement[] } =
    formIds.reduce((prev, cur) => {
      prev[cur] = [];
      return prev;
    }, {});

  for (const groupement of groupements) {
    groupementsGroupedByInitialFormId[groupement.initialFormId].push(
      groupement
    );
  }

  return formIds.map(formId => groupementsGroupedByInitialFormId[formId]);
}
