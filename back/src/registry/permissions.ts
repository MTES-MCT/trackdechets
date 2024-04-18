import { prisma } from "@td/prisma";
import { GovernmentPermission } from "@prisma/client";

/**
 * Les utilisateurs liés à un compte gouvernemental
 * (ex: GEREP, RNDTS) sont susceptibles d'avoir un accès
 * étendu au registre
 */
export async function hasGovernmentRegistryPerm(
  user: Express.User,
  sirets: string[]
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

  if (permissions.includes(GovernmentPermission.REGISTRY_CAN_READ_ALL)) {
    const allIpsAuthorized =
      authorizedIPs.length === 1 && authorizedIPs.includes("ALL");
    // Si la valeur de authorizedIPs est ["ALL"], toutes les ips sont autorisées (à réserver au compte user support de TD)
    const authorizedIP = (authorizedIPs ?? []).find(ip => ip === user.ip);
    if (!authorizedIP && !allIpsAuthorized) {
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
