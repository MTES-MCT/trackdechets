import { prisma } from "@td/prisma";
import type {
  RegistryDelegation,
  RegistryDelegationResolvers
} from "@td/codegen-back";
import { toGqlCompanyPrivate } from "../../../companies/converters";

const getDelegate = async (delegation: RegistryDelegation) => {
  const company = await prisma.registryDelegation
    .findUniqueOrThrow({
      where: { id: delegation.id }
    })
    .delegate();

  return toGqlCompanyPrivate(company);
};

export const delegateResolver: RegistryDelegationResolvers["delegate"] =
  delegation => getDelegate(delegation) as any;
