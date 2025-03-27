import type { Merge, FieldError, FieldErrorsImpl } from "react-hook-form";
import { type FieldErrors } from "react-hook-form";
import { FormShape, FormShapeField } from "./types";

export function formatError(
  error: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined
) {
  if (!error) {
    return "";
  }

  if (error.message) {
    return error.message as string;
  }

  if (error.type === "required") {
    return "Champ requis";
  }

  return "Erreur";
}

export function getTabsWithErrorClass(
  formShape: FormShape,
  errors: FieldErrors<any>
) {
  return formShape.map(item => {
    const tabHasError = hasError(item.fields, errors);

    return {
      ...item,
      ...(tabHasError && { iconId: "tabError fr-icon-warning-line" })
    };
  });
}

function hasError(fields: FormShapeField[], errors: FieldErrors<any>) {
  return fields.some(field => {
    if (field.shape === "layout") {
      return hasError(field.fields, errors);
    }
    if (field.shape === "generic") {
      return errors[field.name] !== undefined;
    }
    if (field.shape === "custom") {
      return field.names.some(name => errors[name] !== undefined);
    }
    return false;
  });
}
