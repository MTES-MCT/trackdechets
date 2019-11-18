import { prisma, User, Company } from "../generated/prisma-client";
import { memoizeRequest } from "./cache";

const companyAssociationUserFragment = `
fragment CompanyWithAdmins on CompanyAssociation {
  user { id isActive name email phone }
}
`;

export function getCompanyInstallation(siret: string) {
  return prisma
    .installations({
      where: {
        OR: [
          { s3icNumeroSiret: siret },
          { irepNumeroSiret: siret },
          { gerepNumeroSiret: siret },
          { sireneNumeroSiret: siret }
        ]
      }
    })
    .then(installations => {
      // return first installation if several match
      return installations ? installations[0] : null;
    });
}

export function getInstallationRubriques(codeS3ic: string) {
  return prisma.rubriques({ where: { codeS3ic } });
}

export function getCompany(siret: string) {
  return prisma.company({ siret });
}

export function getInstallationDeclarations(codeS3ic: string) {
  return prisma.declarations({ where: { codeS3ic } });
}

export function getCompanyUsers(siret: string) {
  return getUsersThroughCompanyAssociations({ company: { siret: siret } });
}

export function getCompanyAdmins(siret: string) {
  return getUsersThroughCompanyAssociations({
    company: { siret: siret },
    role: "ADMIN"
  });
}

function getUsersThroughCompanyAssociations(params: object) {
  return prisma
    .companyAssociations({ where: params })
    .$fragment<{ user: User }[]>(companyAssociationUserFragment)
    .then(association => association.map(a => a.user));
}

export async function getUserCompanies(userId: string) {
  if (!userId) {
    return Promise.resolve([]);
  }

  const companies = await prisma
    .companyAssociations({ where: { user: { id: userId } } })
    .$fragment<{ company: Company }[]>(companyAssociationCompaniesFragment)
    .then(associations => associations.map(a => a.company));

  return Promise.all(
    companies.map(company => {
      return memoizeRequest(company.siret).then(companyInfo => {
        return { ...companyInfo, ...company };
      });
    })
  );
}

const companyAssociationCompaniesFragment = `
fragment AssociationWithCompany on CompanyAssociation {
  company { id siret securityCode companyTypes }
}
`;
