import { prisma } from "@td/prisma";
import {
  RndtsDeclarationDelegation,
  RndtsDeclarationDelegationResolvers
} from "../../../generated/graphql/types";
import { convertUrls } from "../../../companies/database";

const getDelegator = async (delegation: RndtsDeclarationDelegation) => {
  const company = await prisma.rndtsDeclarationDelegation
    .findUniqueOrThrow({
      where: { id: delegation.id }
    })
    .delegator();

  return convertUrls(company);
};

export const delegatorResolver: RndtsDeclarationDelegationResolvers["delegator"] =
  delegation => getDelegator(delegation);
