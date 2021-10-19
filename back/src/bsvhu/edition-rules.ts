import { Bsvhu as PrismaVhuForm } from "@prisma/client";
import { isObject, objectDiff } from "../forms/workflow/diff";
import {
  FormCompany,
  BsvhuInput,
  BsvhuIdentification,
  BsvhuWeight,
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
  "siret",
  "vatNumber"
];

const identificationKeys: Array<keyof BsvhuIdentification> = [
  "numbers",
  "type"
];
const weightKeys: Array<keyof BsvhuWeight> = ["value", "isEstimate"];
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
    agrementNumber: nullFieldRule("emitterEmissionSignatureDate"),
    company: globalNullFieldRule(companyKeys, "emitterEmissionSignatureDate")
  },
  destination: {
    type: nullFieldRule("emitterEmissionSignatureDate"),
    plannedOperationCode: nullFieldRule("emitterEmissionSignatureDate"),
    reception: {
      refusalReason: nullFieldRule("destinationOperationSignatureDate"),
      acceptationStatus: nullFieldRule("destinationOperationSignatureDate"),
      quantity: nullFieldRule("destinationOperationSignatureDate"),
      weight: nullFieldRule("destinationOperationSignatureDate"),
      identification: globalNullFieldRule(
        identificationKeys,
        "destinationOperationSignatureDate"
      ),
      date: nullFieldRule("destinationOperationSignatureDate")
    },
    operation: {
      code: nullFieldRule("destinationOperationSignatureDate"),
      date: nullFieldRule("destinationOperationSignatureDate"),
      nextDestination: {
        company: globalNullFieldRule(
          companyKeys,
          "destinationOperationSignatureDate"
        )
      }
    },
    agrementNumber: nullFieldRule("destinationOperationSignatureDate"),
    company: globalNullFieldRule(
      companyKeys,
      "destinationOperationSignatureDate"
    )
  },
  packaging: nullFieldRule("emitterEmissionSignatureDate"),
  identification: globalNullFieldRule(
    identificationKeys,
    "emitterEmissionSignatureDate"
  ),
  wasteCode: nullFieldRule("emitterEmissionSignatureDate"),
  quantity: nullFieldRule("emitterEmissionSignatureDate"),
  weight: globalNullFieldRule(weightKeys, "emitterEmissionSignatureDate"),
  transporter: {
    company: globalNullFieldRule(
      companyKeys,
      "transporterTransportSignatureDate"
    ),
    transport: {
      takenOverAt: nullFieldRule("transporterTransportSignatureDate")
    },
    recepisse: globalNullFieldRule(
      recepisseKeys,
      "transporterTransportSignatureDate"
    )
  }
};
