import { BsvhuForm as PrismaVhuForm } from "@prisma/client";
import { isObject, objectDiff } from "../forms/workflow/diff";
import {
  FormCompany,
  BsvhuInput,
  BsvhuIdentification,
  BsvhuQuantity,
  BsvhuRecepisse
} from "../generated/graphql/types";
import { expandVhuFormFromDb } from "./converter";

// Cannot extend object otherwise we have problems with arrays
// This way works with nested (on several levels) objects
type InternalRules<TApiKey, TDbKey> = {
  [K in keyof Required<Omit<TApiKey, "__typename">>]: TApiKey[K] extends {
    [subKey: string]: unknown;
  }
    ? InternalRules<TApiKey[K], TDbKey>
    : ((item: TDbKey) => boolean) | boolean;
};

function getNestedKey(obj: any, keys: string[]) {
  return keys.reduce((prev, cur) => prev?.[cur], obj);
}

/**
 * Returns an array of non editable keys
 * A key editability is calculated from existing signatures
 *
 * @param updates The input object
 * @param currentForm The current form state
 * @param prevKeys Internal array used when accessing nested keys
 */
export function getNotEditableKeys(
  updates: BsvhuInput,
  currentForm: PrismaVhuForm
) {
  // Calculate diff between the update & the current form
  // We allow reposting fields if they are not modified
  const diffInput = getDiffInput(updates, currentForm);

  return recursiveGetNotEditableKeys(diffInput, currentForm);
}

function recursiveGetNotEditableKeys(
  updates: BsvhuInput,
  currentPrismaForm: PrismaVhuForm,
  prevKeys: string[] = []
): string[] {
  return Object.keys(updates)
    .map(key => {
      const keysList = [...prevKeys, key];
      if (isObject(updates[key])) {
        return recursiveGetNotEditableKeys(
          updates[key],
          currentPrismaForm,
          keysList
        );
      }

      const rule = getNestedKey(vhuFormRules, keysList);
      return rule(currentPrismaForm) ? null : keysList.join(".");
    })
    .flat()
    .filter(Boolean);
}

function getDiffInput(updates: BsvhuInput, currentForm: PrismaVhuForm) {
  const prismaForm = expandVhuFormFromDb(currentForm);
  return objectDiff(prismaForm, updates);
}

const companyKeys: Array<keyof FormCompany> = [
  "address",
  "contact",
  "country",
  "mail",
  "name",
  "phone",
  "siret"
];

const identificationKeys: Array<keyof BsvhuIdentification> = [
  "numbers",
  "type"
];
const quantityKeys: Array<keyof BsvhuQuantity> = ["number", "tons"];
const recepisseKeys: Array<keyof BsvhuRecepisse> = [
  "number",
  "validityLimit",
  "department"
];

function nullFieldRule(field: keyof PrismaVhuForm) {
  return (item: PrismaVhuForm) => item[field] == null;
}

function globalNullFieldRule<Type>(keys: string[], field: keyof PrismaVhuForm) {
  const rule = item => item[field] == null;

  return keys.reduce((prev, cur) => {
    prev[cur] = rule;
    return prev;
  }, {} as Type);
}

/**
 * Each field returns true if it can be edited, false otherwise.
 */
const vhuFormRules: InternalRules<BsvhuInput, PrismaVhuForm> = {
  emitter: {
    agrementNumber: nullFieldRule("emitterSignatureDate"),
    company: globalNullFieldRule(companyKeys, "emitterSignatureDate")
  },
  recipient: {
    type: nullFieldRule("emitterSignatureDate"),
    acceptance: {
      refusalReason: nullFieldRule("recipientSignatureDate"),
      status: nullFieldRule("recipientSignatureDate"),
      quantity: nullFieldRule("recipientSignatureDate"),
      identification: globalNullFieldRule(
        identificationKeys,
        "recipientSignatureDate"
      )
    },
    operation: {
      done: nullFieldRule("recipientSignatureDate"),
      planned: nullFieldRule("emitterSignatureDate")
    },
    agrementNumber: nullFieldRule("recipientSignatureDate"),
    company: globalNullFieldRule(companyKeys, "recipientSignatureDate"),
    plannedBroyeurCompany: globalNullFieldRule(
      companyKeys,
      "recipientSignatureDate"
    )
  },
  packaging: nullFieldRule("emitterSignatureDate"),
  identification: globalNullFieldRule(
    identificationKeys,
    "emitterSignatureDate"
  ),
  wasteCode: nullFieldRule("emitterSignatureDate"),
  quantity: globalNullFieldRule(quantityKeys, "emitterSignatureDate"),
  transporter: {
    company: globalNullFieldRule(companyKeys, "transporterSignatureDate"),
    tvaIntracommunautaire: nullFieldRule("transporterSignatureDate"),
    recepisse: globalNullFieldRule(recepisseKeys, "transporterSignatureDate")
  }
};
