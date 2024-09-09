import { CreateRndtsDeclarationDelegationInput } from "../../generated/graphql/types";
import { rndtsDeclarationDelegationSchema } from "./schema";

/*
 * Vérification synchrone de l'input de création d'une rndtsDeclarationDelegation
 */
export function parseRndtsDeclarationDelegation(
  input: CreateRndtsDeclarationDelegationInput
) {
  return rndtsDeclarationDelegationSchema.parse(input);
}

export type ParsedDeclarationDelegation = ReturnType<
  typeof parseRndtsDeclarationDelegation
>;
