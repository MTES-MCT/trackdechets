import { BsdasriType, BsdaType, BsffType, EmitterType } from "@prisma/client";
import { BsdSubType } from "@td/codegen-back";

// !!! WARNING !!!
// If you modify these functions, you'll need to re-index the BSDs in ES,
// as they are used by the registry AND ES

interface BsdaForSubType {
  type: BsdaType;
}
export const getBsdaSubType = (bsda: BsdaForSubType): BsdSubType => {
  if (bsda.type === "OTHER_COLLECTIONS") {
    return "INITIAL";
  }

  return bsda.type;
};

interface BsffForSubType {
  type: BsffType;
}
export const getBsffSubType = (bsff: BsffForSubType): BsdSubType => {
  if (bsff.type === "GROUPEMENT") {
    return "GROUPEMENT";
  } else if (bsff.type === "RECONDITIONNEMENT") {
    return "RECONDITIONNEMENT";
  } else if (bsff.type === "REEXPEDITION") {
    return "RESHIPMENT";
  }

  return "INITIAL";
};

interface BsddForSubType {
  id: string;
  readableId?: string | null;
  forwardedInId?: string | null;
  emitterType: EmitterType | null;
}
export const getBsddSubType = (bsdd: BsddForSubType): BsdSubType => {
  if (
    bsdd.forwardedInId ||
    bsdd.id.endsWith("-suite") ||
    bsdd.readableId?.endsWith("-suite")
  ) {
    return "TEMP_STORED";
  }

  if (bsdd.emitterType === "APPENDIX1") {
    return "TOURNEE";
  } else if (bsdd.emitterType === "APPENDIX1_PRODUCER") {
    return "APPENDIX1";
  } else if (bsdd.emitterType === "APPENDIX2") {
    return "APPENDIX2";
  }

  return "INITIAL";
};

interface BsdasriForSubType {
  type: BsdasriType;
}
export const getBsdasriSubType = (bsdasri: BsdasriForSubType): BsdSubType => {
  switch (bsdasri.type) {
    case "SIMPLE":
      return "INITIAL";
    case "SYNTHESIS":
      return "SYNTHESIS";
    case "GROUPING":
      return "GATHERING";
  }
};

export const getBspaohSubType = (_: object): BsdSubType => {
  return "INITIAL";
};

export const getBsvhuSubType = (_: object): BsdSubType => {
  return "INITIAL";
};
