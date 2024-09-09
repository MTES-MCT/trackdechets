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
      delegateOrgId: delegateCompany.orgId,
      delegatorOrgId: delegatorCompany.orgId,
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
