import type { Merge, FieldError, FieldErrorsImpl } from "react-hook-form";
import { type FieldErrors } from "react-hook-form";
import { FormShape, FormShapeField, FormShapeWithState } from "./types";

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

const getFieldsWithState = (
  fields: FormShapeField[],
  errors: FieldErrors<any>,
  disabledFieldNames?: string[]
) => {
  return fields.map(field => {
    if (field.shape === "generic") {
      return {
        ...field,
        ...(disabledFieldNames?.includes(field.name) && { disabled: true })
      };
    } else if (field.shape === "custom") {
      return {
        ...field,
        props: {
          ...field.props,
          ...(disabledFieldNames?.some(disabledFieldName =>
            field.names.includes(disabledFieldName)
          ) && { disabled: true })
        }
      };
    } else if (field.shape === "layout") {
      return {
        ...field,
        fields: getFieldsWithState(field.fields, errors, disabledFieldNames)
      };
    }
    return field;
  });
};

export function getTabsWithState(
  formShape: FormShape,
  errors: FieldErrors<any>,
  disabledFieldNames?: string[]
): FormShapeWithState {
  return formShape.map(item => {
    const tabHasError = hasError(item.fields, errors);
    const fieldsWithState = getFieldsWithState(
      item.fields,
      errors,
      disabledFieldNames
    );
    return {
      ...item,
      fields: fieldsWithState,
      ...(tabHasError && { error: true })
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
