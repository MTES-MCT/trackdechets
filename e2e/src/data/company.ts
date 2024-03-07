import { prisma } from "@td/prisma";
import { generateUniqueTestSiret } from "back";
import { CompanyType, Prisma } from "@prisma/client";

interface VhuAgrement {
  agrementNumber: string;
  department: string;
}

interface TransporterReceipt {
  receiptNumber: string;
  validityLimit: string;
  department: string;
}

interface Opt {
  transporterReceipt?: TransporterReceipt;
  vhuAgrementDemolisseur?: VhuAgrement;
  vhuAgrementBroyeur?: VhuAgrement;
}

export const seedCompany = async (
  companyInput: Partial<Prisma.CompanyCreateInput>,
  opt: Opt = {}
) => {
  let siret: string | null = null;
  if (!companyInput.vatNumber) siret = await generateUniqueTestSiret();

  // Need to create an anonymous company so that fakeSirets increment
  await prisma.anonymousCompany.create({
    data: {
      siret: siret,
      orgId: siret ?? companyInput.vatNumber!,
      name: "Établissement de test",
      address: "Adresse test",
      codeCommune: "00000",
      codeNaf: "XXXXX",
      libelleNaf: "Entreprise de test"
    }
  });

  const company = await prisma.company.create({
    data: {
      securityCode: 1234,
      verificationCode: "1234",
      siret: siret,
      orgId: siret ?? companyInput.vatNumber!,
      name: companyInput.name ?? "",
      ...companyInput
    }
  });

  const { transporterReceipt, vhuAgrementBroyeur, vhuAgrementDemolisseur } =
    opt;

  if (transporterReceipt) {
    const receipt = await prisma.transporterReceipt.create({
      data: transporterReceipt
    });

    if (!!company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { transporterReceipt: { connect: { id: receipt.id } } }
      });
    }
  }

  if (vhuAgrementDemolisseur) {
    const demolisseurAgrement = await prisma.vhuAgrement.create({
      data: vhuAgrementDemolisseur
    });

    await prisma.company.update({
      data: {
        vhuAgrementDemolisseur: { connect: { id: demolisseurAgrement.id } }
      },
      where: { id: company.id }
    });
  }

  if (vhuAgrementBroyeur) {
    const broyeurAgrement = await prisma.vhuAgrement.create({
      data: vhuAgrementBroyeur
    });

    await prisma.company.update({
      data: { vhuAgrementBroyeur: { connect: { id: broyeurAgrement.id } } },
      where: { id: company.id }
    });
  }

  return company;
};

export const seedDefaultCompanies = async () => {
  const companyA = await seedCompany({
    name: "A - Producteur",
    companyTypes: [CompanyType.PRODUCER]
  });

  const companyB = await seedCompany(
    {
      name: "B - Transporteur FR",
      companyTypes: [CompanyType.TRANSPORTER],
      contact: "Monsieur Transporteur",
      contactPhone: "0472568954",
      contactEmail: "monsieurtransporteur@gmail.com"
    },
    {
      transporterReceipt: {
        receiptNumber: "TRANS-063022024",
        validityLimit: "2055-07-31T00:00:00.000Z",
        department: "75"
      }
    }
  );

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
    companyTypes: [CompanyType.WASTE_CENTER]
  });

  const companyI = await seedCompany(
    {
      name: "I - Broyeur / casse automobile",
      companyTypes: [CompanyType.WASTE_VEHICLES],
      contact: "Monsieur Démolisseur et Broyeur",
      contactPhone: "0458758956",
      contactEmail: "monsieurbroyeuretdemolisseur@gmail.com"
    },
    {
      vhuAgrementDemolisseur: {
        agrementNumber: "AGR-DEM-002",
        department: "75"
      },
      vhuAgrementBroyeur: {
        agrementNumber: "AGR-BROYEUR-002",
        department: "75"
      }
    }
  );

  const companyJ = await seedCompany({
    name: "J - Installation TTR",
    companyTypes: [CompanyType.COLLECTOR]
  });

  const companyK = await seedCompany({
    name: "K - Entreprise de travaux",
    companyTypes: [CompanyType.WORKER]
  });

  const companyL = await seedCompany({
    name: "L - Transporteur FR + Installation de traitement",
    companyTypes: [CompanyType.TRANSPORTER, CompanyType.WASTEPROCESSOR]
  });

  const companyM = await seedCompany({
    name: "M - Installation de traitement",
    companyTypes: [CompanyType.WASTEPROCESSOR]
  });

  const companyN = await seedCompany(
    {
      name: "N - Démolisseur",
      companyTypes: [CompanyType.WASTE_VEHICLES],
      contact: "Monsieur Démolisseur",
      contactPhone: "0473625689",
      contactEmail: "monsieurdemolisseur@gmail.com"
    },
    {
      vhuAgrementDemolisseur: {
        agrementNumber: "AGR-DEM-001",
        department: "75"
      }
    }
  );

  const companyO = await seedCompany(
    {
      name: "O - Broyeur",
      companyTypes: [CompanyType.WASTE_VEHICLES],
      contact: "Monsieur Broyeur",
      contactPhone: "0475875695",
      contactEmail: "monsieurbroyeur@gmail.com"
    },
    {
      vhuAgrementBroyeur: {
        agrementNumber: "AGR-BROYEUR-003",
        department: "75"
      }
    }
  );

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
    companyL,
    companyM,
    companyN,
    companyO
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
