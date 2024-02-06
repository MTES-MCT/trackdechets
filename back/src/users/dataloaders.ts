import DataLoader from "dataloader";
import { prisma } from "@td/prisma";
import { getUserRoles } from "../permissions";
import { Company } from "@prisma/client";

export function createUserDataLoaders() {
  return {
    userRoles: new DataLoader((userIds: string[]) => getUsersRoles(userIds)),
    userCompanies: new DataLoader((userIds: string[]) =>
      getUsersCompanies(userIds)
    ),
    activeUserAccountHashesBySiret: new DataLoader((sirets: string[]) =>
      genActiveUserAccountHashesBySiret(sirets)
    )
  };
}

// User roles are already cached in Redis.
// But this dataloader is still useful for cases where you need to load
// user roles n times for the same user in a single HTTP request.
async function getUsersRoles(userIds: string[]) {
  return userIds.map(async userId => {
    const userRoles = await getUserRoles(userId);
    return userRoles;
  });
}

async function getUsersCompanies(userIds: string[]) {
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, company: true }
  });

  const companiesPerUser = companyAssociations.reduce((dict, association) => {
    dict[association.userId] ??= [];
    dict[association.userId].push(association.company);
    return dict;
  }, {} as Record<string, Company[]>);
  return userIds.map(userId => companiesPerUser[userId]);
}

async function genActiveUserAccountHashesBySiret(companySirets: string[]) {
  const userAccountHashes = await prisma.userAccountHash.findMany({
    where: { companySiret: { in: companySirets }, acceptedAt: null }
  });

  return companySirets.map(siret =>
    userAccountHashes.filter(hash => hash.companySiret === siret)
  );
}
