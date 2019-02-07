export function flattenInoutObjectForDb(
  input,
  previousKeys = [],
  dbObject = {}
) {
  Object.keys(input).forEach(key => {
    if (
      input[key] &&
      !Array.isArray(input[key]) &&
      typeof input[key] === "object"
    ) {
      return flattenInoutObjectForDb(
        input[key],
        [...previousKeys, key],
        dbObject
      );
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

export function unflattenObjectFromDb(input, apiObject = {}) {
  const separator = [
    "emitter",
    "recipient",
    "transporter",
    "wasteDetails",
    "company"
  ];

  Object.keys(input).forEach(key => {
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

  return apiObject;
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
    receivedBy,
    receivedAt,
    quantityReceived,
    processingOperationDone,
    ...rest
  } = form;

  return rest;
}
