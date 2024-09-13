import { Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../__tests__/factories";

export const rndtsDeclarationDelegationFactory = async (
  opt?: Partial<Prisma.RndtsDeclarationDelegationCreateInput>
) => {
  const { user: delegateUser, company: delegateCompany } =
    await userWithCompanyFactory();
  const { user: delegatorUser, company: delegatorCompany } =
    await userWithCompanyFactory();

  const delegation = await prisma.rndtsDeclarationDelegation.create({
    data: {
      startDate: new Date(),
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
