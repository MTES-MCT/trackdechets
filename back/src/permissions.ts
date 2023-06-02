import { User, UserRole } from "@prisma/client";
import { ForbiddenError } from "apollo-server-core";
import { cachedGet } from "./common/redis";
import prisma from "./prisma";
import * as thisModule from "./permissions";
import {
  BsdaSignatureType,
  BsdasriSignatureType,
  BsffSignatureType,
  SignatureTypeInput
} from "./generated/graphql/types";
import { checkSecurityCode } from "./common/permissions";

// List of all the permissions
export enum Permission {
  BsdCanRead = "BsdCanRead",
  BsdCanList = "BsdCanList",
  BsdCanCreate = "BsdCanCreate",
  BsdCanUpdate = "BsdCanUpdate",
  BsdCanDelete = "BsdCanDelete",
  BsdCanSign = "BsdCanSign:*",
  BsdCanSignEmission = "BsdCanSign:Emission",
  BsdCanSignWork = "BsdCanSign:Work",
  BsdCanSignTransport = "BsdCanSign:Transport",
  BsdCanSignAcceptation = "BsdCanSign:Acceptation",
  BsdCanSignOperation = "BsdCanSign:Operation",
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

const driverPermissions = [
  ...readerPermissions,
  Permission.BsdCanUpdate, // the driver must be able to update immat
  Permission.BsdCanSignTransport
];

const memberPermissions = [
  ...readerPermissions,
  Permission.BsdCanCreate,
  Permission.BsdCanUpdate,
  Permission.BsdCanSign,
  Permission.BsdCanSignEmission,
  Permission.BsdCanSignWork,
  Permission.BsdCanSignTransport,
  Permission.BsdCanSignAcceptation,
  Permission.BsdCanSignOperation,
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

export const grants: { [Key in UserRole]: Permission[] } = {
  [UserRole.READER]: readerPermissions,
  [UserRole.DRIVER]: driverPermissions,
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
  if (companyAssociations) {
    return companyAssociations.reduce(
      (roles, association) => ({
        ...roles,
        [association.company.orgId]: association.role
      }),
      {}
    );
  }
  return {};
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

type AllSignatureType =
  | BsdaSignatureType
  | BsdasriSignatureType
  | SignatureTypeInput // BSVHU
  | BsffSignatureType;

export const signatureTypeToPermission: {
  [Key in AllSignatureType]: Permission;
} = {
  EMISSION: Permission.BsdCanSignEmission,
  TRANSPORT: Permission.BsdCanSignTransport,
  WORK: Permission.BsdCanSignWork,
  RECEPTION: Permission.BsdCanSignAcceptation,
  ACCEPTATION: Permission.BsdCanSignAcceptation,
  OPERATION: Permission.BsdCanSignOperation
};

export async function checkCanSignFor<SignatureType>(
  user: User,
  signatureType: SignatureType,
  orgIds: string[],
  securityCode?: number | null
) {
  try {
    const hasPerm = await checkUserPermissions(
      user,
      orgIds,
      signatureTypeToPermission[signatureType],
      "Vous ne pouvez pas signer ce bordereau"
    );
    return hasPerm;
  } catch (forbidenError) {
    let error = forbidenError;

    if (securityCode && orgIds.length > 0) {
      // check if security code is valid for one of
      // the authorized organisation identifier
      for (const orgId of orgIds) {
        try {
          const securityCodeValid = await checkSecurityCode(
            orgId,
            securityCode
          );
          return securityCodeValid;
        } catch (invaliSecurityCodeError) {
          error = invaliSecurityCodeError;
        }
      }
    }

    throw error;
  }
}
