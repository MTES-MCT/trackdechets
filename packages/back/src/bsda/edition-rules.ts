import { Bsda, Prisma } from "@prisma/client";
import { isObject, objectDiff } from "../forms/workflow/diff";
import {
  BsdaInput,
  BsdaSignatureType
} from "@trackdechets/codegen/src/back.gen";
import { SealedFieldsError } from "../bsvhu/errors";
import { expandBsdaFromDb } from "./converter";

type StripTypeName<T> = Omit<T, "__typename">;
type EditableRuleType<T> = Required<StripTypeName<T>>;
type EditableFields<Type> = {
  [Key in keyof EditableRuleType<Type>]:
    | EditableFields<EditableRuleType<Type[Key]>>
    | ReturnType<typeof ifAwaitingSignature>;
};

const signatureToFieldMapping: { [key in BsdaSignatureType]: keyof Bsda } = {
  EMISSION: "emitterEmissionSignatureDate",
  WORK: "workerWorkSignatureDate",
  TRANSPORT: "transporterTransportSignatureDate",
  OPERATION: "destinationOperationSignatureDate"
};

const bsdaWithGrouping = Prisma.validator<Prisma.BsdaArgs>()({
  include: { grouping: true }
});
type BsdaWithGrouping = Prisma.BsdaGetPayload<typeof bsdaWithGrouping>;

export function checkKeysEditability(
  updates: BsdaInput,
  bsda: BsdaWithGrouping
) {
  // Calculate diff between the update & the current form
  // as we allow reposting fields if they are not modified
  const diffInput = getDiffInput(updates, bsda);

  const invalidKeys = getInvalidKeys(diffInput, bsda);
  if (invalidKeys.length) {
    throw new SealedFieldsError(invalidKeys);
  }
}

const editableFields: EditableFields<BsdaInput> = {
  type: ifAwaitingSignature("EMISSION"),
  emitter: ifAwaitingSignature("EMISSION"),
  destination: {
    company: ifAwaitingSignature("EMISSION"),
    cap: ifAwaitingSignature("EMISSION"),
    plannedOperationCode: ifAwaitingSignature("EMISSION"),
    reception: ifAwaitingSignature("OPERATION"),
    operation: ifAwaitingSignature("OPERATION"),
    customInfo: ifAwaitingSignature("OPERATION")
  },
  waste: {
    code: ifAwaitingSignature("EMISSION"),
    name: ifAwaitingSignature("EMISSION"),
    familyCode: ifAwaitingSignature("WORK"),
    materialName: ifAwaitingSignature("WORK"),
    consistence: ifAwaitingSignature("WORK"),
    sealNumbers: ifAwaitingSignature("WORK"),
    adr: ifAwaitingSignature("WORK"),
    pop: ifAwaitingSignature("WORK")
  },
  packagings: ifAwaitingSignature("WORK"),
  weight: ifAwaitingSignature("WORK"),
  worker: {
    company: ifAwaitingSignature("EMISSION"),
    work: ifAwaitingSignature("WORK")
  },
  broker: ifAwaitingSignature("EMISSION"),
  transporter: ifAwaitingSignature("TRANSPORT"),
  ecoOrganisme: ifAwaitingSignature("TRANSPORT"),
  grouping: ifAwaitingSignature("EMISSION"),
  forwarding: ifAwaitingSignature("EMISSION")
};

function ifAwaitingSignature(signature: BsdaSignatureType) {
  const field = signatureToFieldMapping[signature];
  return (bsda: Bsda) => bsda[field] == null;
}

function getDiffInput(updates: BsdaInput, currentForm: BsdaWithGrouping) {
  const prismaForm = expandBsdaFromDb(currentForm);

  return objectDiff(
    {
      ...prismaForm,
      grouping: currentForm.grouping?.map(g => g.id)
    },
    updates
  );
}

function getInvalidKeys(updates: BsdaInput, bsda: Bsda): string[] {
  const listOfDeepKeys = recursiveGetFlatKeys(updates);
  return listOfDeepKeys
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
