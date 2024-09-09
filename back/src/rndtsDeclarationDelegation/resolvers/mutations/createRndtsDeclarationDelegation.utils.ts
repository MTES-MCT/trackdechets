import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { CreateRndtsDeclarationDelegationInput } from "../../../generated/graphql/types";
import { getRndtsDeclarationDelegationRepository } from "../../repository";
import { ParsedDeclarationDelegation } from "../../validation";

export const getDelegateAndDelegatorOrThrow = async (
  input: CreateRndtsDeclarationDelegationInput
) => {
  const companies = await prisma.company.findMany({
    where: {
      orgId: { in: [input.delegatorOrgId, input.delegateOrgId] }
    }
  });

  const delegator = companies.find(
    company => company.orgId === input.delegatorOrgId
  );
  const delegate = companies.find(
    company => company.orgId === input.delegateOrgId
  );

  if (!delegator) {
    throw new UserInputError(
      `L'entreprise ${input.delegatorOrgId} visée comme délégante n'existe pas`
    );
  }

  if (!delegate) {
    throw new UserInputError(
      `L'entreprise ${input.delegateOrgId} visée comme délégataire n'existe pas`
    );
  }

  return { delegator, delegate };
};

export const createDelegation = async (
  user: Express.User,
  input: ParsedDeclarationDelegation
) => {
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  return delegationRepository.create(input);
};

export const checkNoExistingActiveDelegation = async (
  user: Express.User,
  input: ParsedDeclarationDelegation
) => {
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  const activeDelegation = await delegationRepository.findActive(input);

  if (activeDelegation) {
    throw new UserInputError(
      `Une délégation est déjà active pour ce délégataire et ce délégant (id ${activeDelegation.id})`
    );
  }
};
