import DataLoader from "dataloader";
import { prisma } from "@td/prisma";
import { UserRole } from "@prisma/client";

export function createCompanyDataLoaders() {
  return {
    installations: new DataLoader((sirets: string[]) =>
      genInstallations(sirets)
    ),
    companiesAdmin: new DataLoader((companyIds: string[]) =>
      getCompaniesAdmin(companyIds)
    )
  };
}

async function genInstallations(sirets: string[]) {
  const installations = await prisma.installation.findMany({
    where: {
      OR: [
        { s3icNumeroSiret: { in: sirets } },
        { irepNumeroSiret: { in: sirets } },
        { gerepNumeroSiret: { in: sirets } },
        { sireneNumeroSiret: { in: sirets } }
      ]
    }
  });

  return sirets.map(
    siret =>
      installations.find(
        installation =>
          installation.s3icNumeroSiret === siret ||
          installation.irepNumeroSiret === siret ||
          installation.gerepNumeroSiret === siret ||
          installation.sireneNumeroSiret === siret
      ) ?? null
  );
}

/**
 * Étant donné une liste d'identifiants d'établissements
 * Renvoie le premier admin trouvé pour chaque établissement.
 */
async function getCompaniesAdmin(companyIds: string[]) {
  const companyAssociations = await prisma.companyAssociation.findMany({
    where: { companyId: { in: companyIds }, role: UserRole.ADMIN },
    // On ne va pas chercher directement ici la liste des admins
    // car il se peut qu'un établissement ait beaucoup d'admins (>1000)
    // Or nous on veut juste le premier admin que l'on trouve
    select: { companyId: true, userId: true }
  });

  // Groupe les identifiants des admins par `companyId`
  const groupedByCompanyId = companyAssociations.reduce<{
    [key: string]: string[];
  }>((acc, { companyId, userId }) => {
    if (acc[companyId]) {
      return { ...acc, [companyId]: [...acc[companyId], userId] };
    }
    return { ...acc, [companyId]: [userId] };
  }, {});

  // Construit le tableau des idenfiants du premier
  // admin trouvé par établissement
  const firstAdminIds: string[] = [];
  for (const companyId of Object.keys(groupedByCompanyId)) {
    const adminIds = groupedByCompanyId[companyId];
    if (adminIds && adminIds.length > 0) {
      firstAdminIds.push(adminIds[0]);
    }
  }

  // Récupères les admins en DB
  const firstAdmins = await prisma.user.findMany({
    where: { id: { in: firstAdminIds } }
  });

  const companyAssociationsWithAdmins = companyAssociations
    .map(association => ({
      ...association,
      admin: firstAdmins.find(user => user.id === association.userId)
    }))
    // Garde uniquement les associations correspondant au premier admin trouvé
    .filter(association => Boolean(association.admin));

  // Renvoie le premier admin trouvé pour chaque `companyId`
  return companyIds.map(companyId => {
    const association = companyAssociationsWithAdmins.find(
      association => association.companyId === companyId
    );
    return association?.admin ?? null;
  });
}
