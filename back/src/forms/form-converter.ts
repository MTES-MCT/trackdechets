import { Form as PrismaForm } from "../generated/prisma-client";
import { Form, TemporaryStorageDetail } from "../generated/graphql/types";

export function flattenObjectForDb(
  input,
  previousKeys = [],
  dbObject = {}
): Partial<PrismaForm> {
  const relations = ["ecoOrganisme", "temporaryStorageDetail"];

  Object.keys(input).forEach(key => {
    if (relations.includes(key)) {
      dbObject[key] = {};
      return input[key]
        ? flattenObjectForDb(input[key], [], dbObject[key])
        : {};
    }

    if (
      input[key] &&
      !Array.isArray(input[key]) &&
      typeof input[key] === "object"
    ) {
      return flattenObjectForDb(input[key], [...previousKeys, key], dbObject);
    }

    const objectKey = [...previousKeys, key]
      .map((k, i) => {
        if (i !== 0) {
          return k.charAt(0).toUpperCase() + k.slice(1);
        }
        return k;
      })
      .join("");

    dbObject[objectKey] = input[key];
  });

  return dbObject;
}

export function unflattenObjectFromDb(input, apiObject = {}): any {
  const separator = [
    "emitter",
    "recipient",
    "transporter",
    "trader",
    "wasteDetails",
    "company",
    "nextDestination",
    "workSite",
    "temporaryStorer",
    "destination"
  ];

  Object.keys(input).forEach(key => {
    if (
      !Array.isArray(input[key]) &&
      typeof input[key] === "object" &&
      input[key] !== null
    ) {
      apiObject[key] = unflattenObjectFromDb(input[key], {});
      return;
    }

    const index = separator.findIndex(s => key.startsWith(s));
    if (index === -1) {
      apiObject[key] = input[key];
      return;
    }

    const localKey = separator[index];
    const newKey =
      key
        .replace(localKey, "")
        .charAt(0)
        .toLowerCase() + key.replace(localKey, "").slice(1);

    apiObject[localKey] = {
      ...apiObject[localKey],
      ...unflattenObjectFromDb({ [newKey]: input[key] }, apiObject[localKey])
    };
    return;
  });

  return apiObject as any;
}

export function cleanUpNotDuplicatableFieldsInForm(form) {
  const {
    id,
    createdAt,
    updatedAt,
    readableId,

    transporterNumberPlate,

    status,
    sentAt,
    sentBy,

    isAccepted,
    wasteAcceptationStatus,
    wasteRefusalReason,
    receivedBy,
    receivedAt,
    quantityReceived,
    processingOperationDone,
    ...rest
  } = form;

  return rest;
}
