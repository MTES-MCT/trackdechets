import { prisma, User, Company } from "../generated/prisma-client";
import { memoizeRequest } from "./cache"


const companyAssociationUserFragment = `
fragment CompanyWithAdmins on CompanyAssociation {
  user { id isActive name email phone userType }
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

export async function getUserCompanies(userId: string) {

  const companies = await prisma
    .companyAssociations({ where: { user: { id: userId } } })
    .$fragment<{ company: Company }[]>(companyAssociationCompaniesFragment)
    .then(associations => associations.map(a => a.company));

  return Promise.all(companies.map(company => {
    return memoizeRequest(company.siret).then(companyInfo => {
      return {...company, ...companyInfo};
    });
  }))
}

const companyAssociationCompaniesFragment = `
fragment AssociationWithCompany on CompanyAssociation {
  company { id siret securityCode }
}
`;
