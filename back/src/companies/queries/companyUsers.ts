import { prisma, User, UserRole } from "../../generated/prisma-client";
import { CompanyMember } from "../../generated/graphql/types";

/**
 * Concat active company users and invited company users
 * @param siret
 */
export async function getCompanyUsers(siret: string): Promise<CompanyMember[]> {
  const activeUsers = await getCompanyActiveUsers(siret);
  const invitedUsers = await getCompanyInvitedUsers(siret);

  return [...activeUsers, ...invitedUsers];
}

const companyMemberFragment = `
fragment CompanyMember on CompanyAssociation {
  role,
  user {
    id
    isActive
    name
    email
    phone
  }
}
`;

type CompanyMemberFragment = Pick<User, "id" | "email" | "name" | "isActive">;

/**
 * Returns company members that already have an account in TD
 * @param siret
 */
export function getCompanyActiveUsers(siret: string): Promise<CompanyMember[]> {
  return prisma
    .companyAssociations({ where: { company: { siret } } })
    .$fragment<{ user: CompanyMemberFragment; role: UserRole }[]>(
      companyMemberFragment
    )
    .then(associations =>
      associations.map(a => {
        return {
          ...a.user,
          isPendingInvitation: false
        };
      })
    );
}

/**
 * Returns users who have been invited to join the company
 * but whose account haven't been created yet
 * @param siret
 */
export async function getCompanyInvitedUsers(
  siret: string
): Promise<CompanyMember[]> {
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

/**
 * Returns active company members who are admin
 * of the company
 * @param siret
 */
export async function getCompanyAdminUsers(siret: string) {
  const users = await getCompanyActiveUsers(siret);
  return users.filter(c => c.role === "ADMIN");
}
