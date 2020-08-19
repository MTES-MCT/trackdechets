import { Form } from "../../generated/prisma-client";
import { formSchema } from "./validation";
import {
  UserInputError,
  ForbiddenError,
  ApolloError
} from "apollo-server-express";
import { expandFormFromDb } from "../form-converter";
export enum WorkflowError {
  InvalidForm,
  InvalidTransition,
  MissingSignature,
  InvalidSecurityCode,
  AppendixError,
  HasSegmentsToTakeOverError
}

export async function getError(error: WorkflowError, form: Form) {
  switch (error) {
    case WorkflowError.InvalidForm:
      const errors: string[] = await formSchema
        .validate(expandFormFromDb(form), { abortEarly: false })
        .catch(err => err.errors);
      return new UserInputError(
        `Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\nErreur(s): ${errors.join(
          "\n"
        )}`
      );

    case WorkflowError.InvalidTransition:
      return new ForbiddenError(
        "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
      );

    case WorkflowError.HasSegmentsToTakeOverError:
      return new ForbiddenError(
        "Vous ne pouvez pas passer ce bordereau à l'état souhaité, il n'est pas encore pris en charge par le dernier transporteur"
      );
    default:
      return new ApolloError("Une erreur est survenue.");
  }
}
