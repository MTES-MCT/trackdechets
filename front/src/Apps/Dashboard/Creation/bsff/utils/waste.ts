import { BsffType } from "@td/codegen-ui";

type WeightedPackaging = {
  weight?: number | null;
};

export const getBsffPackagingsTotalWeight = (packagings: WeightedPackaging[]) =>
  packagings.reduce(
    (total, packaging) => total + (Number(packaging.weight) || 0),
    0
  );

export const isBsffOperatorWasteStep = (type: BsffType) =>
  type === BsffType.CollectePetitesQuantites;

export const isBsffSpecialWasteStep = (type: BsffType) =>
  [
    BsffType.Groupement,
    BsffType.Reexpedition,
    BsffType.Reconditionnement
  ].includes(type);

export const hasBsffPackagingAccordions = (type: BsffType) =>
  [BsffType.CollectePetitesQuantites, BsffType.TracerFluide].includes(type);
