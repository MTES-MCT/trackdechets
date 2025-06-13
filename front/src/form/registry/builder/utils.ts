import { RegistryLineReason } from "@td/codegen-ui";
import { type UseFormReturn } from "react-hook-form";
import { type FormShapeField, type FormShape } from "./types";
import { z } from "zod";
import { ApolloError } from "@apollo/client";

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

export const handleServerError = (
  methods: UseFormReturn<any>,
  error: ApolloError | Error
) => {
  if (error instanceof ApolloError) {
    // Handle GraphQL errors
    methods.setError("root.serverError", {
      type: "server",
      message:
        error.message ||
        "Une erreur inconnue est survenue, merci de réessayer dans quelques instants. Si le problème persiste vous pouvez contacter le support"
    });
  } else {
    methods.setError("root.serverError", {
      type: "server",
      message:
        "Une erreur inconnue est survenue, merci de réessayer dans quelques instants. Si le problème persiste vous pouvez contacter le support"
    });
  }
};
