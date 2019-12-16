import { prisma, User, Company, UserRole } from "../generated/prisma-client";
import { getCachedCompanySireneInfo } from "./insee";

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

export async function getUserRole(userId: string, siret: string) {
  const associations = await prisma.companyAssociations({
    where: { user: { id: userId }, company: { siret: siret } }
  });
  if (associations.length > 0) {
    return associations[0].role;
  }
  return null;
}

const companyUserFragment = `
fragment CompanyUser on CompanyAssociation {
  role,
  user {
    id
    isActive
    name
    email
  }
}
`;

export async function getCompanyUsers(siret: string) {
  const users = await prisma
    .companyAssociations({ where: { company: { siret } } })
    .$fragment<{ user: User; role: UserRole }[]>(companyUserFragment)
    .then(associations =>
      associations.map(a => {
        return { ...a.user, role: a.role, isPendingInvitation: false };
      })
    );

  const invitedUsers = await getCompanyInvitedUsers(siret);

  return [...users, ...invitedUsers];
}

async function getCompanyInvitedUsers(siret: string) {
  const hashes = await prisma.userAccountHashes({
    where: { companySiret: siret }
  });
  return hashes.map(h => {
    return {
      id: h.id,
      name: "Invité",
      email: h.email,
      role: h.role,
      isActive: false,
      isPendingInvitation: true
    };
  });
}

const companyFragment = `
fragment Company on CompanyAssociation {
  company { id siret securityCode gerepId companyTypes }
}
`;

type CompanyFragment = Pick<
  Company,
  "id" | "siret" | "securityCode" | "companyTypes"
>;

export async function getUserCompanies(
  userId: string
): Promise<CompanyFragment[]> {
  if (!userId) {
    return Promise.resolve([]);
  }

  const companies = await prisma
    .companyAssociations({ where: { user: { id: userId } } })
    .$fragment<{ company: Company }[]>(companyFragment)
    .then(associations => associations.map(a => a.company));

  return Promise.all(
    companies.map(async company => {
      const companySireneInfo = await getCachedCompanySireneInfo(company.siret);
      const companyIcpeInfo = {
        installation: await getCompanyInstallation(company.siret)
      };
      return { ...companyIcpeInfo, ...companySireneInfo, ...company };
    })
  );
}
