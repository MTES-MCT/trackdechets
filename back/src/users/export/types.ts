import { Company, UserRole } from "@td/prisma";

// Représente un utilisateur au sein d'un établissement
export type UserInCompany = Company & {
  userEmail: string;
  userName: string;
  userJoinedAt: Date | null;
  userRole: UserRole;
};
