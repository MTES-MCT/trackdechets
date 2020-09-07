import { ForbiddenError, ApolloError } from "apollo-server-express";
export enum WorkflowError {
  InvalidForm,
  InvalidTransition,
  MissingSignature,
  InvalidSecurityCode,
  AppendixError,
  HasSegmentsToTakeOverError
}

export async function getError(error: WorkflowError) {
  switch (error) {
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
