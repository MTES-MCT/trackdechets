import { Company, Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../__tests__/factories";
import { startOfDay } from "../../utils";

export const registryDelegationFactory = async (
  opt?: Partial<Prisma.RegistryDelegationCreateInput>
) => {
  const { user: delegateUser, company: delegateCompany } =
    await userWithCompanyFactory();
  const { user: delegatorUser, company: delegatorCompany } =
    await userWithCompanyFactory();

  const delegation = await prisma.registryDelegation.create({
    data: {
      startDate: startOfDay(new Date()),
      delegate: { connect: { id: delegateCompany.id } },
      delegator: { connect: { id: delegatorCompany.id } },
      ...opt
    }
  });

  return {
    delegation,
    delegateUser,
    delegateCompany,
    delegatorUser,
    delegatorCompany
  };
};

export const registryDelegationFactoryWithExistingCompanies = async (
  delegate: Company,
  delegator: Company,
  opt?: Partial<Prisma.RegistryDelegationCreateInput>
) => {
  const delegation = await prisma.registryDelegation.create({
    data: {
      startDate: startOfDay(new Date()),
      delegate: { connect: { id: delegate.id } },
      delegator: { connect: { id: delegator.id } },
      ...opt
    }
  });

  return delegation;
};
