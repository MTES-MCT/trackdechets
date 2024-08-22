import { prisma } from "@td/prisma";
import { GovernmentPermission } from "@prisma/client";
import { NotLoggedIn } from "../common/errors";

export async function hasGovernmentPerm(
  user: Express.User,
  sirets: string[],
  requiredPermission: GovernmentPermission
): Promise<boolean> {
  if (!user.governmentAccountId || !user.ip) {
    return false;
  }

  const governmentAccount = await prisma.user
    .findUniqueOrThrow({
      where: { id: user.id }
    })
    .governmentAccount();

  if (!governmentAccount) {
    return false;
  }

  const { permissions, authorizedIPs, authorizedOrgIds } = governmentAccount;

  if (permissions.includes(requiredPermission)) {
    const authorizedIP = (authorizedIPs ?? []).find(ip => ip === user.ip);
    if (!authorizedIP) {
      // la requête ne provient pas d'une IP autorisée
      return false;
    } else {
      if (authorizedOrgIds.length === 1 && authorizedOrgIds.includes("ALL")) {
        // Si la valeur de orgIds est ["ALL"], on considère que le compte
        // gouvernemental a accès à l'ensemble des établissements
        return true;
      } else {
        return sirets.every(siret => authorizedOrgIds.includes(siret));
      }
    }
  }

  return false;
}

/**
 * Les utilisateurs liés à un compte gouvernemental
 * (ex: GEREP, RNDTS) sont susceptibles d'avoir un accès
 * étendu au registre
 */
export async function hasGovernmentRegistryPerm(
  user: Express.User,
  sirets: string[]
): Promise<boolean> {
  return hasGovernmentPerm(
    user,
    sirets,
    GovernmentPermission.REGISTRY_CAN_READ_ALL
  );
}

/**
 * La fiche établissement/gerico necessite des permissions spécifiques via un compte gouvernemental
 */
export async function hasGovernmentReadAllBsdsPermOrThrow(
  user: Express.User
): Promise<void> {
  const hasPerm = await hasGovernmentPerm(
    user,
    [],
    GovernmentPermission.BSDS_CAN_READ_ALL
  );

  if (!hasPerm) {
    throw new NotLoggedIn();
  }
}
