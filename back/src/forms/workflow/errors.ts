import { DomainError, ErrorCode } from "../../common/errors";
import { Form } from "../../generated/prisma-client";
import { formSchema } from "../validator";

export enum WorkflowError {
  InvalidForm,
  InvalidTransition,
  MissingSignature,
  InvalidSecurityCode,
  AppendixError
}

export async function getError(error: WorkflowError, form: Form) {
  switch (error) {
    case WorkflowError.InvalidForm:
      const errors: string[] = await formSchema
        .validate(form, { abortEarly: false })
        .catch(err => err.errors);
      return new DomainError(
        `Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\nErreur(s): ${errors.join(
          "\n"
        )}`,
        ErrorCode.BAD_USER_INPUT
      );

    case WorkflowError.InvalidSecurityCode:
      return new DomainError(
        "Code de sécurité producteur incorrect. En cas de doute vérifiez sa valeur sur votre espace dans l'onglet 'Mon compte'.",
        ErrorCode.FORBIDDEN
      );

    case WorkflowError.InvalidTransition:
      return new DomainError(
        "Vous ne pouvez pas passer ce bordereau à l'état souhaité.",
        ErrorCode.FORBIDDEN
      );

    case WorkflowError.MissingSignature:
      return new DomainError(
        "Le transporteur et le producteur du déchet doivent tous deux valider l'enlèvement",
        ErrorCode.BAD_USER_INPUT
      );

    default:
      return new DomainError("Une erreur est survenue.", ErrorCode.FORBIDDEN);
  }
}
