import { prisma } from "@td/prisma";
import { convertUrls } from "../../../companies/database";
import {
  RegistryDelegation,
  RegistryDelegationResolvers
} from "../../../generated/graphql/types";

const getDelegate = async (delegation: RegistryDelegation) => {
  const company = await prisma.registryDelegation
    .findUniqueOrThrow({
      where: { id: delegation.id }
    })
    .delegate();

  return convertUrls(company);
};

export const delegateResolver: RegistryDelegationResolvers["delegate"] =
  delegation => getDelegate(delegation) as any;
