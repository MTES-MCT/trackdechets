import { prisma } from "@td/prisma";
import { generateTestSiret } from "back";
import { CompanyType } from "@prisma/client";

export const seedCompany = async company => {
  let siret;
  if (!company.vatNumber) siret = await generateTestSiret();

  // Need to create an anonymous company so that fakeSirets increment
  await prisma.anonymousCompany.create({
    data: {
      siret: siret,
      orgId: siret ?? company.vatNumber,
      name: "Établissement de test",
      address: "Adresse test",
      codeCommune: "00000",
      codeNaf: "XXXXX",
      libelleNaf: "Entreprise de test"
    }
  });

  return prisma.company.create({
    data: {
      securityCode: 1234,
      verificationCode: "1234",
      siret: siret,
      orgId: siret ?? company.vatNumber,
      ...company
    }
  });
};

export const seedDefaultCompanies = async () => {
  const companyA = await seedCompany({
    name: "A - Producteur",
    companyTypes: [CompanyType.PRODUCER]
  });

  const companyB = await seedCompany({
    name: "B - Transporteur FR",
    companyTypes: [CompanyType.TRANSPORTER]
  });

  const companyC = await seedCompany({
    name: "C - Transporteur étranger",
    companyTypes: [CompanyType.TRANSPORTER],
    vatNumber: "DE00000001"
  });

  const companyD = await seedCompany({
    name: "D - Installation de traitement",
    companyTypes: [CompanyType.WASTEPROCESSOR]
  });

  const companyE = await seedCompany({
    name: "E - Négociant",
    companyTypes: [CompanyType.TRADER]
  });

  const companyF = await seedCompany({
    name: "F - Eco-organisme",
    companyTypes: [CompanyType.ECO_ORGANISME]
  });

  const companyG = await seedCompany({
    name: "G - Courtier",
    companyTypes: [CompanyType.BROKER]
  });

  const companyH = await seedCompany({
    name: "H - Déchetterie",
    companyTypes: [CompanyType.WASTEPROCESSOR]
  });

  const companyI = await seedCompany({
    name: "I - Broyeur / casse automobile",
    companyTypes: [CompanyType.WASTE_VEHICLES]
  });

  const companyJ = await seedCompany({
    name: "J - Installation TTR",
    companyTypes: [CompanyType.WASTE_CENTER]
  });

  const companyK = await seedCompany({
    name: "K - Entreprise de travaux",
    companyTypes: [CompanyType.WORKER]
  });

  const companyL = await seedCompany({
    name: "L - Transporteur FR + Installation de traitement",
    companyTypes: [CompanyType.TRANSPORTER, CompanyType.WASTEPROCESSOR]
  });

  return {
    companyA,
    companyB,
    companyC,
    companyD,
    companyE,
    companyF,
    companyG,
    companyH,
    companyI,
    companyJ,
    companyK,
    companyL
  };
};

export const getCompany = async (siret: string) => {
  return prisma.company.findFirst({
    where: { siret }
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

export const seedCompanyAssociations = async (
  userId: string,
  companies: { id: string }[],
  role
) => {
  await companies.map(
    async company => await seedCompanyAssociation(userId, company.id, role)
  );
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
