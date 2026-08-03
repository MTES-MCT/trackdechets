import { RepositoryTransaction } from "../../../common/repository/types";

export async function checkPackagingGroupIntegrity(
  packagingId: string,
  destinationBsffId: string,
  prisma: RepositoryTransaction
) {
  const packaging = await prisma.bsffPackaging.findUnique({
    where: { id: packagingId },
    include: {
      ficheInterventions: {
        include: {
          packagings: {
            select: {
              id: true,
              bsffId: true
            }
          }
        }
      }
    }
  });

  if (!packaging) {
    throw new Error("Packaging introuvable");
  }

  for (const fiche of packaging.ficheInterventions) {
    for (const linkedPackaging of fiche.packagings) {
      if (
        linkedPackaging.bsffId &&
        linkedPackaging.bsffId !== destinationBsffId
      ) {
        throw new Error(
          "Les contenants associés à une même fiche d'intervention doivent rester sur le même BSFF."
        );
      }
    }
  }
}
