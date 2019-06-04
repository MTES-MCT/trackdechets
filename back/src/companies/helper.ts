import { prisma, User, Company } from "../generated/prisma-client";

const companyAssociationUserFragment = `
fragment CompanyWithAdmins on CompanyAssociation {
  user { id isActive email phone userType }
}
`;

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

export function getUserCompanies(userId: string) {
  return prisma
    .companyAssociations({ where: { user: { id: userId } } })
    .$fragment<{ company: Company }[]>(companyAssociationCompaniesFragment)
    .then(association => association.map(a => a.company));
}

const companyAssociationCompaniesFragment = `
fragment AssociationWithCompany on CompanyAssociation {
  company { id siret securityCode }
}
`;
