import DataLoader from "dataloader";
import { prisma } from "@td/prisma";

export function createUserDataLoaders() {
  return {
    activeUserAccountHashesBySiret: new DataLoader((sirets: string[]) =>
      genActiveUserAccountHashesBySiret(sirets)
    )
  };
}

async function genActiveUserAccountHashesBySiret(companySirets: string[]) {
  const userAccountHashes = await prisma.userAccountHash.findMany({
    where: { companySiret: { in: companySirets }, acceptedAt: null }
  });

  return companySirets.map(siret =>
    userAccountHashes.filter(hash => hash.companySiret === siret)
  );
}
