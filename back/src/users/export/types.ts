import { Company, UserRole } from "@prisma/client";

// Représente un utilisateur au sein d'un établissement
export type UserInCompany = Company & {
  userEmail: string;
  userName: string;
  userJoinedAt: Date | null;
  userRole: UserRole;
};
