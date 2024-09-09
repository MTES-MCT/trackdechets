import {
  CreateRndtsDeclarationDelegationInput,
  QueryRndtsDeclarationDelegationArgs
} from "../../generated/graphql/types";
import {
  queryRndtsDeclarationDelegationArgsSchema,
  createRndtsDeclarationDelegationInputSchema
} from "./schema";

/*
 * Vérification synchrone de l'input de création d'une rndtsDeclarationDelegation
 */
export function parseCreateRndtsDeclarationDelegationInput(
  input: CreateRndtsDeclarationDelegationInput
) {
  return createRndtsDeclarationDelegationInputSchema.parse(input);
}

export type ParsedCreateRndtsDeclarationDelegationInput = ReturnType<
  typeof parseCreateRndtsDeclarationDelegationInput
>;

export function parseQueryRndtsDeclarationDelegationArgs(
  args: QueryRndtsDeclarationDelegationArgs
) {
  return queryRndtsDeclarationDelegationArgsSchema.parse(args);
}
