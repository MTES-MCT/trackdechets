import DataLoader from "dataloader";
import prisma from "../prisma";

export function createCompanyDataLoaders() {
  return {
    installations: new DataLoader((sirets: string[]) =>
      genInstallations(sirets)
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
