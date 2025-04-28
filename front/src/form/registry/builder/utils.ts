import { RegistryLineReason } from "@td/codegen-ui";

import { FormShapeField, FormShape } from "./types";
import { z } from "zod";

export function isoDateToHtmlDate(date: unknown) {
  if (typeof date !== "string") {
    return undefined;
  }

  return date.split("T")[0];
}

const getFieldValidations = (
  field: FormShapeField
): Record<string, z.ZodType> => {
  switch (field.shape) {
    case "generic":
    case "custom":
      return field.validation;
    case "layout":
      return field.fields.reduce(
        (acc, childField) => ({ ...acc, ...getFieldValidations(childField) }),
        {}
      );
    default:
      return {};
  }
};

// Creates a zod schema from a form shape that contains validation rules
export const schemaFromShape = (shape: FormShape) => {
  const validations = shape.reduce(
    (acc, tab) => {
      const tabValidations = tab.fields.reduce(
        (fieldAcc, field) => ({ ...fieldAcc, ...getFieldValidations(field) }),
        {}
      );
      return { ...acc, ...tabValidations };
    },
    {
      reason: z.enum([RegistryLineReason.Edit]).nullish()
    }
  );

  return z.object(validations);
};
