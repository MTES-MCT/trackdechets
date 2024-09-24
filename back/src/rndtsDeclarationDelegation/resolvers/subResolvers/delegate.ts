import { prisma } from "@td/prisma";
import { convertUrls } from "../../../companies/database";
import {
  RndtsDeclarationDelegation,
  RndtsDeclarationDelegationResolvers
} from "../../../generated/graphql/types";

const getDelegate = async (delegation: RndtsDeclarationDelegation) => {
  const company = await prisma.rndtsDeclarationDelegation
    .findUniqueOrThrow({
      where: { id: delegation.id }
    })
    .delegate();

  return convertUrls(company);
};

export const delegateResolver: RndtsDeclarationDelegationResolvers["delegate"] =
  delegation => getDelegate(delegation) as any;
