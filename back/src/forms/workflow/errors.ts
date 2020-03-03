import { Form } from "../../generated/prisma-client";
import { formSchema } from "../validator";
import {
  UserInputError,
  ForbiddenError,
  ApolloError
} from "apollo-server-express";

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
      return new UserInputError(
        `Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\nErreur(s): ${errors.join(
          "\n"
        )}`
      );

    case WorkflowError.InvalidSecurityCode:
      return new ForbiddenError(
        "Code de sécurité producteur incorrect. En cas de doute vérifiez sa valeur sur votre espace dans l'onglet 'Mon compte'."
      );

    case WorkflowError.InvalidTransition:
      return new ForbiddenError(
        "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
      );

    case WorkflowError.MissingSignature:
      return new UserInputError(
        "Le transporteur et le producteur du déchet doivent tous deux valider l'enlèvement"
      );

    default:
      return new ApolloError("Une erreur est survenue.");
  }
}
