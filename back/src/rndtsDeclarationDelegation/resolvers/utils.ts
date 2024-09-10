import { prisma } from "@td/prisma";
import { UserInputError } from "../../common/errors";
import { CreateRndtsDeclarationDelegationInput } from "../../generated/graphql/types";
import { getRndtsDeclarationDelegationRepository } from "../repository";

export const findDelegateAndDelegatorOrThrow = async (
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

export const findDelegationByIdOrThrow = async (
  user: Express.User,
  id: string
) => {
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  const delegation = await delegationRepository.findFirst({ id });

  if (!delegation) {
    throw new UserInputError(`La demande de délégation ${id} n'existe pas.`);
  }

  return delegation;
};
