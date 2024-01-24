import { prisma } from "@td/prisma";
import { generateTestSiret } from "back";

export const seedCompany = async company => {
  const siret = await generateTestSiret();

  return prisma.company.create({
    data: {
      ...company,
      siret,
      orgId: siret,
      securityCode: 1234,
      verificationCode: "1234"
    }
  });
};

export const seedCompanyAssociation = async (
  userId: string,
  companyId: string,
  role
) => {
  return prisma.companyAssociation.create({
    data: {
      user: { connect: { id: userId } },
      company: {
        connect: { id: companyId }
      },
      role: role
    }
  });
};

export const getCompanyAssociation = async (
  userId: string,
  companyId: string
) => {
  return prisma.companyAssociation.findFirst({
    where: {
      userId,
      companyId
    }
  });
};
