import { prisma } from "@td/prisma";
import {
  RegistryDelegation,
  RegistryDelegationResolvers
} from "../../../generated/graphql/types";
import { convertUrls } from "../../../companies/database";

const getDelegator = async (delegation: RegistryDelegation) => {
  const company = await prisma.registryDelegation
    .findUniqueOrThrow({
      where: { id: delegation.id }
    })
    .delegator();

  return convertUrls(company);
};

export const delegatorResolver: RegistryDelegationResolvers["delegator"] =
  delegation => getDelegator(delegation) as any;
