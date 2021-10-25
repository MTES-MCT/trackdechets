import { Bsda } from "@prisma/client";
import { isObject, objectDiff } from "../forms/workflow/diff";
import { BsdaInput, BsdaSignatureType } from "../generated/graphql/types";
import { SealedFieldsError } from "../bsvhu/errors";
import { expandBsdaFromDb } from "./converter";

const signatureToFieldMapping: { [key in BsdaSignatureType]: keyof Bsda } = {
  EMISSION: "emitterEmissionSignatureDate",
  WORK: "workerWorkSignatureDate",
  TRANSPORT: "transporterTransportSignatureDate",
  OPERATION: "destinationOperationSignatureDate"
};

export function checkKeysEditability(updates: BsdaInput, bsda: Bsda) {
  // Calculate diff between the update & the current form
  // as we allow reposting fields if they are not modified
  const diffInput = getDiffInput(updates, bsda);

  const invalidKeys = getInvalidKeys(diffInput, bsda);
  if (invalidKeys.length) {
    throw new SealedFieldsError(invalidKeys);
  }
}

// TODO typings
const editableFields = {
  type: ifAwaitingSignature("EMISSION"),
  emitter: ifAwaitingSignature("EMISSION"),
  destination: {
    company: ifAwaitingSignature("EMISSION"),
    cap: ifAwaitingSignature("EMISSION"),
    plannedOperationCode: ifAwaitingSignature("EMISSION"),
    reception: ifAwaitingSignature("OPERATION"),
    operation: ifAwaitingSignature("OPERATION")
  },
  waste: {
    code: ifAwaitingSignature("EMISSION"),
    name: ifAwaitingSignature("EMISSION"),
    familyCode: ifAwaitingSignature("WORK"),
    materialName: ifAwaitingSignature("WORK"),
    consistence: ifAwaitingSignature("WORK"),
    sealNumbers: ifAwaitingSignature("WORK"),
    adr: ifAwaitingSignature("WORK")
  },
  packagings: ifAwaitingSignature("WORK"),
  weight: ifAwaitingSignature("WORK"),
  worker: {
    company: ifAwaitingSignature("EMISSION"),
    work: ifAwaitingSignature("WORK")
  },
  broker: ifAwaitingSignature("EMISSION"),
  transporter: {
    company: ifAwaitingSignature("EMISSION"),
    recepisse: ifAwaitingSignature("TRANSPORT"),
    transport: ifAwaitingSignature("TRANSPORT")
  },
  grouping: ifAwaitingSignature("EMISSION"),
  forwarding: ifAwaitingSignature("EMISSION")
};

function ifAwaitingSignature(signature: BsdaSignatureType) {
  const field = signatureToFieldMapping[signature];
  return (bsda: Bsda) => bsda[field] == null;
}

function getDiffInput(updates: BsdaInput, currentForm: Bsda) {
  const prismaForm = expandBsdaFromDb(currentForm);
  return objectDiff(prismaForm, updates);
}

function getInvalidKeys(updates: BsdaInput, bsda: Bsda): string[] {
  const listOfDeepKees = recursiveGetFlatKeys(updates);
  return listOfDeepKees
    .map(({ keys }) => {
      const rule = getSafeNestedKey(editableFields, keys);
      return rule(bsda) ? null : keys.join(".");
    })
    .filter(Boolean);
}

function recursiveGetFlatKeys(
  updates: BsdaInput,
  prevKeys: string[] = []
): { keys: string[] }[] {
  return Object.keys(updates)
    .map(key => {
      const keysList = [...prevKeys, key];
      if (isObject(updates[key])) {
        return recursiveGetFlatKeys(updates[key], keysList);
      }
      return { keys: keysList };
    })
    .flat();
}

function getSafeNestedKey(obj: any, keys: string[]) {
  return keys.reduce((prev, cur) => {
    if (prev[cur]) {
      return prev[cur];
    }
    return prev;
  }, obj);
}
