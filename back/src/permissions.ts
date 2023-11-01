import { User, UserRole } from "@prisma/client";
import { cachedGet } from "./common/redis";
import prisma from "./prisma";
import {
  BsdaSignatureType,
  BsdasriSignatureType,
  BsffSignatureType,
  SignatureTypeInput,
  UserPermission
} from "./generated/graphql/types";
import { checkSecurityCode } from "./common/permissions";
import { ForbiddenError } from "./common/errors";

// List of all the permissions
export enum Permission {
  BsdCanRead = "BsdCanRead",
  BsdCanList = "BsdCanList",
  BsdCanCreate = "BsdCanCreate",
  BsdCanUpdate = "BsdCanUpdate",
  BsdCanDelete = "BsdCanDelete",
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

export function toGraphQLPermission(permission: Permission): UserPermission {
  const mapping: { [key in Permission]: UserPermission } = {
    [Permission.BsdCanRead]: "BSD_CAN_READ",
    [Permission.BsdCanList]: "BSD_CAN_LIST",
    [Permission.BsdCanCreate]: "BSD_CAN_CREATE",
    [Permission.BsdCanUpdate]: "BSD_CAN_UPDATE",
    [Permission.BsdCanDelete]: "BSD_CAN_DELETE",
    [Permission.BsdCanSignEmission]: "BSD_CAN_SIGN_EMISSION",
    [Permission.BsdCanSignWork]: "BSD_CAN_SIGN_WORK",
    [Permission.BsdCanSignTransport]: "BSD_CAN_SIGN_TRANSPORT",
    [Permission.BsdCanSignAcceptation]: "BSD_CAN_SIGN_ACCEPTATION",
    [Permission.BsdCanSignOperation]: "BSD_CAN_SIGN_OPERATION",
    [Permission.BsdCanRevise]: "BSD_CAN_REVISE",
    [Permission.RegistryCanRead]: "REGISTRY_CAN_READ",
    [Permission.CompanyCanRead]: "COMPANY_CAN_READ",
    [Permission.CompanyCanUpdate]: "COMPANY_CAN_UPDATE",
    [Permission.CompanyCanVerify]: "COMPANY_CAN_VERIFY",
    [Permission.CompanyCanManageSignatureAutomation]:
      "COMPANY_CAN_MANAGE_SIGNATURE_AUTOMATION",
    [Permission.CompanyCanManageMembers]: "COMPANY_CAN_MANAGE_MEMBERS",
    [Permission.CompanyCanRenewSecurityCode]: "COMPANY_CAN_RENEW_SECURITY_CODE"
  };
  return mapping[permission];
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
async function getUserRolesFn(userId: string): Promise<{
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
  return cachedGet(getUserRolesFn, USER_ROLES_CACHE_KEY, userId, {
    parser: JSON,
    options: { EX: USER_ROLES_CACHE_EXPIRY }
  });
}

export async function getUserRole(
  userId: string,
  orgId: string
): Promise<UserRole | undefined> {
  const userRoles = await getUserRoles(userId);
  return userRoles[orgId];
}

/**
 * Checks a user has a given permission on at least one of the
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