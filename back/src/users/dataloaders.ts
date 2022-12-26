import DataLoader from "dataloader";
import prisma from "../prisma";

export function createUserDataLoaders() {
  return {
    activeUserAccountHashesBySiret: new DataLoader((ids: string[]) =>
      genActiveUserAccountHashesByIds(ids)
    )
  };
}

async function genActiveUserAccountHashesByIds(companyIds: string[]) {
  const userAccountHashes = await prisma.userAccountHash.findMany({
    where: { companyId: { in: companyIds }, acceptedAt: null }
  });

  return companyIds.map(id =>
    userAccountHashes.filter(hash => hash.companyId === id)
  );
}
