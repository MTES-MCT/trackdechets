import { isObject } from "src/forms/workflow/diff";
import {
  Signature,
  VhuForm as GqlVhuForm,
  VhuFormInput
} from "src/generated/graphql/types";
import { VhuForm as PrismaVhuForm } from "@prisma/client";

// Cannot extend object otherwise we have problems with arrays
// This way works with nested (on several levels) objects
type InternalRules<T, V> = {
  [K in keyof T]: T[K] extends { [subKey: string]: unknown }
    ? InternalRules<T[K], V>
    : ((item: V) => boolean) | boolean;
};

function getNestedKey(obj: any, keys: string[]) {
  return keys.reduce((prev, cur) => prev[cur], obj);
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
  updates: VhuFormInput,
  currentForm: PrismaVhuForm,
  prevKeys: string[] = []
): string[] {
  return Object.keys(updates)
    .map(key => {
      const keysList = [...prevKeys, key];
      if (isObject(updates[key])) {
        return getNotEditableKeys(updates[key], currentForm, keysList);
      }

      const rule = getNestedKey(vhuFormRules, keysList);
      return rule(currentForm) ? null : keysList.join(".");
    })
    .flat()
    .filter(Boolean);
}

const signatureRule: InternalRules<Signature, PrismaVhuForm> = {
  signedAt: false,
  signedBy: false
};

const getCompanyRule = (field: keyof PrismaVhuForm) => {
  const rule = item => item[field] != null;

  return {
    address: rule,
    contact: rule,
    country: rule,
    mail: rule,
    name: rule,
    phone: rule,
    siret: rule
  };
};

const nullFieldRule = (field: keyof PrismaVhuForm) => (item: PrismaVhuForm) =>
  item[field] == null;

/**
 * Each field returns true if it can be edited, false otherwise.
 */
const vhuFormRules: InternalRules<GqlVhuForm, PrismaVhuForm> = {
  id: false,
  createdAt: false,
  updatedAt: false,
  isDeleted: false,
  isDraft: item =>
    [
      item.emitterSignatureId,
      item.recipientOperationSignatureId,
      item.recipientAcceptanceSignatureId,
      item.transporterSignatureId
    ].every(s => s == null),
  emitter: {
    agreement: nullFieldRule("emitterSignatureId"),
    signature: signatureRule,
    validityLimit: nullFieldRule("emitterSignatureId"),
    company: getCompanyRule("emitterSignatureId")
  },
  recipient: {
    acceptance: {
      status: nullFieldRule("recipientAcceptanceSignatureId")
    },
    operation: {
      done: nullFieldRule("recipientOperationSignatureId"),
      planned: nullFieldRule("emitterSignatureId")
    },
    agreement: nullFieldRule("recipientAcceptanceSignatureId"),
    company: getCompanyRule("recipientAcceptanceSignatureId"),
    validityLimit: nullFieldRule("recipientAcceptanceSignatureId")
  },
  wasteDetails: {
    identificationNumbers: nullFieldRule("emitterSignatureId"),
    identificationType: nullFieldRule("emitterSignatureId"),
    packagingType: nullFieldRule("emitterSignatureId"),
    quantity: nullFieldRule("emitterSignatureId"),
    quantityUnit: nullFieldRule("emitterSignatureId")
  },
  transporter: {
    agreement: nullFieldRule("transporterSignatureId"),
    company: getCompanyRule("transporterSignatureId"),
    department: nullFieldRule("transporterSignatureId"),
    receipt: nullFieldRule("transporterSignatureId"),
    signature: signatureRule,
    transportType: nullFieldRule("transporterSignatureId"),
    validityLimit: nullFieldRule("transporterSignatureId")
  }
};
