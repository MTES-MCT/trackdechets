import { BsffType } from "@td/codegen-ui";

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
