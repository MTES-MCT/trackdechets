import { User, UserRole } from "@prisma/client";
import { ForbiddenError } from "apollo-server-core";
import { cachedGet } from "./common/redis";
import prisma from "./prisma";
import * as thisModule from "./permissions";

// List of all the permissions
export enum Permission {
  BsdCanRead = "BsdCanRead",
  BsdCanList = "BsdCanList",
  BsdCanCreate = "BsdCanCreate",
  BsdCanUpdate = "BsdCanUpdate",
  BsdCanDelete = "BsdCanDelete",
  BsdCanSign = "BsdCanSign",
  BsdCanRevise = "BsdCanRevise",
  RegistryCanRead = "RegistryCanRead",
  CompanyCanRead = "CompanyCanRead",
  CompanyCanUpdate = "CompanyCanUpdate",
  CompanyCanVerify = "CompanyCanVerify",
  CompanyCanManageSignatureAutomation = "CompanyCanManageSignatureAutomation",
  CompanyCanManageMembers = "CompanyCanManageMembers",
  CompanyCanRenewSecurityCode = "CompanyCanRenewSecurityCode"
}

/**
 *  Define permission on a per role basis (Role-based access control)
 *
 * > Role-based access control (RBAC) refers to the idea of assigning permissions
 * > to users based on their role within an organization. It offers a simple,
 * > manageable approach to access management that is less prone to error than
 * > assigning permissions to users individually.
 */

const readerPermissions = [
  Permission.BsdCanRead,
  Permission.BsdCanList,
  Permission.CompanyCanRead,
  Permission.RegistryCanRead
];

const memberPermissions = [
  ...readerPermissions,
  Permission.BsdCanCreate,
  Permission.BsdCanUpdate,
  Permission.BsdCanSign,
  Permission.BsdCanDelete,
  Permission.BsdCanRevise
];

const adminPermissions = [
  ...memberPermissions,
  Permission.CompanyCanUpdate,
  Permission.CompanyCanVerify,
  Permission.CompanyCanManageSignatureAutomation,
  Permission.CompanyCanManageMembers,
  Permission.CompanyCanRenewSecurityCode
];

export const grants: { [Key in UserRole | "READER"]: Permission[] } = {
  READER: readerPermissions,
  [UserRole.MEMBER]: memberPermissions,
  [UserRole.ADMIN]: adminPermissions
};

/**
 * Determine if a given role is granted a given permission
 */
export function can(role: UserRole, permission: Permission) {
  return !!role && !!grants[role].find(p => p === permission);
}

const USER_ROLES_CACHE_EXPIRY = 10 * 60; // 10 minutes
export const USER_ROLES_CACHE_KEY = "UserRoles";

/**
 * Retrieves roles of a user in the different companies to which
 * he or she belongs. The companies are identified by their n°SIRET
 * or VAT number. Exemple :
 *
 * {
 *   "85001946400021": "ADMIN",
 *   "IT13029381004": "MEMBER"
 * }
 *
 * The result is cached for 10 minutes
 */
export async function getUserRolesFn(userId: string): Promise<{
  [key: string]: UserRole;
}> {
  const companyAssociations = await prisma.user
    .findUnique({ where: { id: userId } })
    .companyAssociations({
      include: { company: { select: { orgId: true } } }
    });
  return companyAssociations.reduce(
    (roles, association) => ({
      ...roles,
      [association.company.orgId]: association.role
    }),
    {}
  );
}

/**
 * Cached version of getUserRolesFn
 */
export async function getUserRoles(userId: string): Promise<{
  [key: string]: UserRole;
}> {
  return cachedGet(
    // allows to spy on getUserRolesFn in __tests__/permissions.integration.ts
    // see https://stackoverflow.com/questions/45111198/how-to-mock-functions-in-the-same-module-using-jest
    thisModule.getUserRolesFn,
    USER_ROLES_CACHE_KEY,
    userId,
    {
      parser: JSON,
      options: { EX: USER_ROLES_CACHE_EXPIRY }
    }
  );
}

/**
 * Checks auser has a given permission on at least one of the
 * company whose orgId is passed in paramater
 *
 * This function bridges the gap between user roles and company
 * permissions required to perform actions on resources
 */
export async function checkUserPermissions(
  user: User,
  orgIds: string | string[],
  permission: Permission,
  errorMsg = "Vous n'êtes pas autorisé à effectuer cette action"
) {
  if (typeof orgIds === "string") {
    return checkUserPermissions(user, [orgIds], permission, errorMsg);
  }

  const userRoles = await getUserRoles(user.id);
  for (const orgId of orgIds.filter(Boolean)) {
    if (
      Object.keys(userRoles).includes(orgId) &&
      can(userRoles[orgId], permission)
    ) {
      return true;
    }
  }
  throw new ForbiddenError(errorMsg);
}
