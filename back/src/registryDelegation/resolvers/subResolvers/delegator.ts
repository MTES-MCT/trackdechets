import { prisma } from "@td/prisma";
import type {
  RegistryDelegation,
  RegistryDelegationResolvers
} from "@td/codegen-back";
import { toGqlCompanyPrivate } from "../../../companies/converters";

const getDelegator = async (delegation: RegistryDelegation) => {
  const company = await prisma.registryDelegation
    .findUniqueOrThrow({
      where: { id: delegation.id }
    })
    .delegator();

  return toGqlCompanyPrivate(company);
};

export const delegatorResolver: RegistryDelegationResolvers["delegator"] =
  delegation => getDelegator(delegation) as any;
