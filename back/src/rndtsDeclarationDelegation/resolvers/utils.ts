import { prisma } from "@td/prisma";
import { UserInputError } from "../../common/errors";
import { getRndtsDeclarationDelegationRepository } from "../repository";
import { Prisma } from "@prisma/client";

export const findDelegateAndDelegatorOrThrow = async (
  delegateOrgId: string,
  delegatorOrgId: string
) => {
  const companies = await prisma.company.findMany({
    where: {
      orgId: { in: [delegateOrgId, delegatorOrgId] }
    }
  });

  const delegator = companies.find(company => company.orgId === delegatorOrgId);
  const delegate = companies.find(company => company.orgId === delegateOrgId);

  if (!delegator) {
    throw new UserInputError(
      `L'entreprise ${delegatorOrgId} visée comme délégante n'existe pas dans Trackdéchets`
    );
  }

  if (!delegate) {
    throw new UserInputError(
      `L'entreprise ${delegateOrgId} visée comme délégataire n'existe pas dans Trackdéchets`
    );
  }

  return { delegator, delegate };
};

export const findDelegationByIdOrThrow = async (
  user: Express.User,
  id: string,
  options?: Omit<Prisma.RndtsDeclarationDelegationFindFirstArgs, "where">
) => {
  const delegationRepository = getRndtsDeclarationDelegationRepository(user);
  const delegation = await delegationRepository.findFirst({ id }, options);

  if (!delegation) {
    throw new UserInputError(`La demande de délégation ${id} n'existe pas.`);
  }

  return delegation;
};
