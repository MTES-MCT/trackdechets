import { FormGroupement } from "@prisma/client";
import DataLoader from "dataloader";
import prisma from "../prisma";
import { expandableFormIncludes } from "./converter";

export function createFormDataLoaders() {
  return {
    forms: new DataLoader((formIds: string[]) => getForms(formIds)),
    forwardedIns: new DataLoader((formIds: string[]) =>
      getForwardedIns(formIds)
    ),
    initialFormGoupements: new DataLoader((formIds: string[]) =>
      getInitialFormGroupements(formIds)
    ),
    nextFormGoupements: new DataLoader((formIds: string[]) =>
      getNextFormGroupements(formIds)
    )
  };
}

async function getForms(formIds: string[]) {
  const forms = await prisma.form.findMany({
    where: {
      id: { in: formIds }
    },
    include: expandableFormIncludes
  });

  return formIds.map(formId => forms.find(form => form.id === formId));
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

async function getInitialFormGroupements(formIds: string[]) {
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

async function getNextFormGroupements(formIds: string[]) {
  const groupements = await prisma.formGroupement.findMany({
    where: {
      nextFormId: { in: formIds }
    }
  });

  const groupementsGroupedByNextFormId: { [id: string]: FormGroupement[] } =
    formIds.reduce((prev, cur) => {
      prev[cur] = [];
      return prev;
    }, {});

  for (const groupement of groupements) {
    groupementsGroupedByNextFormId[groupement.nextFormId].push(groupement);
  }

  return formIds.map(formId => groupementsGroupedByNextFormId[formId]);
}