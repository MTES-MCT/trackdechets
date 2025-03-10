import type { Merge, FieldError, FieldErrorsImpl } from "react-hook-form";

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
