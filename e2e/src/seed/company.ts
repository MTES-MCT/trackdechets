import { prisma } from "@td/prisma";
import { generateTestSiret } from "back";

export const seedCompany = async (company) => {
    const siret = await generateTestSiret();

    const seededCompany = await prisma.company.create({
        data: {
            ...company,
            siret, 
            orgId: siret,
            securityCode: 1234,
            verificationCode: "1234"
        }
    });

    return seededCompany;
};

export const seedCompanyAssociation = async (userId: string, companyId: string, role) => {
    const association = await prisma.companyAssociation.create({
        data: {
            user: { connect: { id: userId } },
            company: {
               connect: { id: companyId }
            },
            role: role
          }
    });

    return association;
};