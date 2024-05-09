import {
  Bsff,
  Bsdasri,
  Bsvhu,
  BsdType,
  Form,
  Bsd,
  Bsda,
  Bspaoh,
  BsdasriType,
  FormStatus,
  Transporter,
  BsdaTransporter
} from "@td/codegen-ui";

import {
  BsdCurrentTransporterInfos,
  BsdDisplay,
  BsdStatusCode,
  BsdTypename,
  TBsdStatusCode
} from "../common/types/bsdTypes";

const mapBsdStatusToBsdStatusEnum = (status: string): TBsdStatusCode => {
  const bsdStatusCode = Object.values(BsdStatusCode).find(
    key => status === key.toUpperCase()
  ) as unknown as TBsdStatusCode;
  return bsdStatusCode;
};

const mapBsdTypeNameToBsdType = (
  typeName: string | undefined
): BsdType | undefined => {
  switch (typeName) {
    case BsdTypename.Bsdd:
      return BsdType.Bsdd;
    case BsdTypename.Bsda:
      return BsdType.Bsda;
    case BsdTypename.Bsdasri:
      return BsdType.Bsdasri;
    case BsdTypename.Bsvhu:
      return BsdType.Bsvhu;
    case BsdTypename.Bsff:
      return BsdType.Bsff;
    case BsdTypename.Bspaoh:
      return BsdType.Bspaoh;
    default:
      return undefined;
  }
};

export const formatBsd = (bsd: Bsd): BsdDisplay | null => {
  switch (bsd.__typename) {
    case BsdTypename.Bsdd:
      return mapBsdd(bsd);
    case BsdTypename.Bsda:
      return mapBsda(bsd);
    case BsdTypename.Bsdasri:
      return mapBsdasri(bsd);
    case BsdTypename.Bsvhu:
      return mapBsvhu(bsd);
    case BsdTypename.Bsff:
      return mapBsff(bsd);
    case BsdTypename.Bspaoh:
      return mapBspaoh(bsd);
    default:
      return null;
  }
};

export const getCurrentTransporterInfos = (
  bsd: Bsd,
  currentSiret: string,
  isToCollectTab: boolean
): BsdCurrentTransporterInfos | null => {
  switch (bsd.__typename) {
    case BsdTypename.Bsdd:
      return getBsddCurrentTransporterInfos(bsd, currentSiret, isToCollectTab);
    case BsdTypename.Bsda:
      return getBsdaCurrentTransporterInfos(bsd, currentSiret, isToCollectTab);
    case BsdTypename.Bsdasri:
      return getBsdasriCurrentTransporterInfos(bsd, currentSiret);
    case BsdTypename.Bsvhu:
      return null;
    case BsdTypename.Bsff:
      return getBsffCurrentTransporterInfos(bsd, currentSiret);
    case BsdTypename.Bspaoh:
      return getBspaohCurrentTransporterInfos(bsd, currentSiret);
    default:
      return null;
  }
};

export const getBsddCurrentTransporterInfos = (
  bsdd: Form,
  currentSiret: string,
  isToCollectTab: boolean
): BsdCurrentTransporterInfos => {
  let currentTransporter: Transporter | undefined;
  // in case the BSD is going through temporary storage,
  // fetch the transporter from the temporaryStorageDetail property
  if (
    bsdd.status === FormStatus.Resealed ||
    bsdd.status === FormStatus.Resent ||
    bsdd.status === FormStatus.SignedByTempStorer ||
    bsdd.status === FormStatus.TempStored ||
    bsdd.status === FormStatus.TempStorerAccepted
  ) {
    currentTransporter =
      bsdd.temporaryStorageDetail?.transporter &&
      bsdd.temporaryStorageDetail?.transporter.company?.orgId === currentSiret
        ? bsdd.temporaryStorageDetail?.transporter
        : undefined;
  } else {
    if (isToCollectTab) {
      // find the first transporter with this SIRET who hasn't taken over yet
      currentTransporter = bsdd.transporters?.find(
        transporter =>
          transporter.company?.orgId === currentSiret &&
          !transporter.takenOverAt
      );
    } else {
      // find the last transporter with this SIRET who has taken over
      currentTransporter = [...(bsdd.transporters ?? [])]
        .reverse()
        .find(
          transporter =>
            transporter.company?.orgId === currentSiret &&
            !!transporter.takenOverAt
        );
    }
  }
  if (!currentTransporter) {
    return {};
  }
  return {
    transporterId: currentTransporter?.id,
    transporterNumberPlate: currentTransporter?.numberPlate,
    transporterCustomInfo: currentTransporter?.customInfo
  };
};

export const getBsdaCurrentTransporterInfos = (
  bsda: Bsda,
  currentSiret: string,
  isToCollectTab: boolean
): BsdCurrentTransporterInfos => {
  let currentTransporter: BsdaTransporter | undefined;
  if (isToCollectTab) {
    // find the first transporter with this SIRET who hasn't taken over yet
    currentTransporter = bsda.transporters?.find(
      transporter =>
        transporter.company?.orgId === currentSiret &&
        !transporter.transport?.takenOverAt
    );
  } else {
    // find the last transporter with this SIRET who has taken over
    currentTransporter = [...(bsda.transporters ?? [])]
      .reverse()
      .find(
        transporter =>
          transporter.company?.orgId === currentSiret &&
          !!transporter.transport?.takenOverAt
      );
  }
  if (!currentTransporter) {
    return {};
  }
  return {
    transporterId: currentTransporter?.id,
    transporterNumberPlate: currentTransporter?.transport?.plates,
    transporterCustomInfo: currentTransporter?.customInfo
  };
};

export const getBsdasriCurrentTransporterInfos = (
  bsdasri: Bsdasri,
  currentSiret: string
): BsdCurrentTransporterInfos => {
  const currentTransporter = bsdasri.transporter;
  if (currentTransporter?.company?.orgId !== currentSiret) {
    return {};
  }
  // since there is only one transporter per BSDASRI, transporterId is useless,
  // the update is done through the BSD using its id
  return {
    transporterNumberPlate: currentTransporter?.transport?.plates,
    transporterCustomInfo: currentTransporter?.customInfo
  };
};

export const getBsffCurrentTransporterInfos = (
  bsff: Bsff,
  currentSiret: string
): BsdCurrentTransporterInfos => {
  const currentTransporter = bsff.transporter || bsff["bsffTransporter"];
  if (currentTransporter?.company?.orgId !== currentSiret) {
    return {};
  }
  return {
    transporterNumberPlate: currentTransporter?.transport?.plates,
    transporterCustomInfo: currentTransporter?.customInfo
  };
};

export const getBspaohCurrentTransporterInfos = (
  bspaoh: Bspaoh,
  currentSiret: string
): BsdCurrentTransporterInfos => {
  const currentTransporter = bspaoh.transporter;
  if (currentTransporter?.company?.orgId !== currentSiret) {
    return {};
  }
  return {
    transporterNumberPlate: currentTransporter?.transport?.plates,
    transporterCustomInfo: currentTransporter?.customInfo
  };
};

export const mapBsdd = (bsdd: Form): BsdDisplay => {
  const bsddFormatted: BsdDisplay = {
    id: bsdd.id,
    readableid: bsdd.readableId,
    customId: bsdd.customId,
    type: mapBsdTypeNameToBsdType(bsdd.__typename) || BsdType.Bsdd,
    isDraft: bsdd.status === BsdStatusCode.Draft,
    emitterType: bsdd.emitter?.type,
    status: mapBsdStatusToBsdStatusEnum(bsdd.status),
    wasteDetails: {
      code: bsdd.wasteDetails?.code,
      name: bsdd.wasteDetails?.name,
      weight:
        bsdd.quantityReceived ||
        bsdd.temporaryStorageDetail?.wasteDetails?.quantity ||
        bsdd.wasteDetails?.quantity
    },
    isTempStorage: bsdd.recipient?.isTempStorage,
    emitter: bsdd.emitter,
    destination: bsdd.recipient,
    transporter: bsdd.transporter,
    transporters: bsdd.transporters,
    ecoOrganisme: bsdd.ecoOrganisme,
    updatedAt: bsdd.stateSummary?.lastActionOn,
    emittedByEcoOrganisme: bsdd.emittedByEcoOrganisme,
    grouping: bsdd.grouping,
    temporaryStorageDetail: bsdd.temporaryStorageDetail,
    bsdWorkflowType: bsdd.emitter?.type,
    transporterCustomInfo:
      bsdd.transporter?.customInfo || bsdd.stateSummary?.transporterCustomInfo,
    transporterNumberPlate:
      bsdd.transporter?.numberPlate ||
      bsdd.stateSummary?.transporterNumberPlate,
    metadata: bsdd.metadata
  } as BsdDisplay;
  return bsddFormatted;
};

const mapBsda = (bsda: Bsda): BsdDisplay => {
  const statusCode = bsda?.status || bsda["bsdaStatus"];
  const bsdaFormatted: BsdDisplay = {
    id: bsda.id,
    readableid: bsda.id,
    type: mapBsdTypeNameToBsdType(bsda.__typename) || BsdType.Bsda,
    isDraft: bsda.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsda.waste?.code || bsda.waste?.["bsdaCode"],
      name: bsda.waste?.materialName,
      weight: bsda?.destination?.reception?.weight || bsda?.weight?.value
    },
    emitter: bsda.emitter || bsda["bsdaEmitter"],
    destination: bsda.destination || bsda["bsdaDestination"],
    transporter: bsda.transporter || bsda["bsdaTransporter"],
    transporters: bsda.transporters,
    ecoOrganisme: bsda.ecoOrganisme,
    updatedAt: bsda.updatedAt || bsda["bsdaUpdatedAt"],
    emittedByEcoOrganisme: bsda.ecoOrganisme,
    worker: bsda.worker,
    bsdWorkflowType: bsda.type || bsda["bsdaType"],
    groupedIn: bsda.groupedIn,
    forwardedIn: bsda.forwardedIn,
    grouping: bsda.grouping,
    transporterCustomInfo:
      bsda.transporter?.customInfo || bsda["bsdaTransporter"]?.customInfo,
    transporterNumberPlate:
      bsda.transporter?.transport?.plates ||
      bsda["bsdaTransporter"]?.transport?.plates,
    metadata: bsda.metadata
  };
  return bsdaFormatted;
};
const truncateTransporterInfo = (text?: string) =>
  !!text ? text.slice(0, 15) : text;

export const mapBsdasri = (bsdasri: Bsdasri): BsdDisplay => {
  const statusCode = bsdasri?.status || bsdasri["bsdasriStatus"];
  const wasteCode = bsdasri.waste?.code || bsdasri["bsdasriWaste"]?.code;
  const wasteName =
    wasteCode === "18 01 03*"
      ? "DASRI origine humaine"
      : "DASRI origine animale"; //18 02 02*
  const bsdasriFormatted: BsdDisplay = {
    id: bsdasri.id,
    readableid: bsdasri.id,
    type: mapBsdTypeNameToBsdType(bsdasri.__typename) || BsdType.Bsdasri,
    isDraft: bsdasri.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: wasteCode,
      weight: bsdasri.destination?.operation?.weight?.value,
      name: wasteName
    },
    emitter: bsdasri.emitter || bsdasri["bsdasriEmitter"],
    destination: bsdasri.destination || bsdasri["bsdasriDestination"],
    transporter: bsdasri.transporter || bsdasri["bsdasriTransporter"],
    ecoOrganisme: bsdasri.ecoOrganisme,
    updatedAt: bsdasri.updatedAt,
    emittedByEcoOrganisme: bsdasri.ecoOrganisme?.emittedByEcoOrganisme,
    bsdWorkflowType: bsdasri?.type,
    grouping: bsdasri?.grouping,
    synthesizing: bsdasri?.synthesizing,
    allowDirectTakeOver: bsdasri?.allowDirectTakeOver,
    transporterCustomInfo: truncateTransporterInfo(
      bsdasri.transporter?.customInfo ||
        bsdasri["bsdasriTransporter"]?.customInfo
    ),
    transporterNumberPlate:
      bsdasri.transporter?.transport?.plates ||
      bsdasri["bsdasriTransporter"]?.transport?.plates,
    synthesizedIn: bsdasri.synthesizedIn
  };
  return bsdasriFormatted;
};

const mapBsvhu = (bsvhu: Bsvhu): BsdDisplay => {
  const statusCode = bsvhu?.status || bsvhu["bsvhuStatus"];
  const wasteCode = bsvhu?.wasteCode;
  const wasteName =
    wasteCode === "16 01 04*" ? "VHU non dépollués" : "VHU dépollués"; //16 01 06
  const bsvhuFormatted: BsdDisplay = {
    id: bsvhu.id,
    readableid: bsvhu.id,
    type: mapBsdTypeNameToBsdType(bsvhu.__typename) || BsdType.Bsvhu,
    isDraft: bsvhu.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsvhu?.wasteCode,
      weight: bsvhu?.destination?.reception?.weight || bsvhu?.weight?.value,
      name: wasteName
    },
    emitter: bsvhu.emitter || bsvhu["bsvhuEmitter"],
    destination: bsvhu.destination || bsvhu["bsvhuDestination"],
    transporter: bsvhu.transporter || bsvhu["bsvhuTransporter"],
    updatedAt: bsvhu["bsvhuUpdatedAt"]
  };
  return bsvhuFormatted;
};

const mapBsff = (bsff: Bsff): BsdDisplay => {
  const statusCode = bsff?.status || bsff["bsffStatus"];
  const bsffFormatted: BsdDisplay = {
    id: bsff.id,
    readableid: bsff.id,
    type: mapBsdTypeNameToBsdType(bsff.__typename) || BsdType.Bsff,
    isDraft: bsff.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: bsff.waste?.code,
      name: bsff.waste?.description,
      weight: bsff["bsffWeight"]?.value
    },
    emitter: bsff.emitter || bsff["bsffEmitter"],
    destination: bsff.destination || bsff["bsffDestination"],
    transporter: bsff.transporter || bsff["bsffTransporter"],
    updatedAt: bsff["bsffUpdatedAt"],
    bsdWorkflowType: bsff["bsffType"] || bsff.type,
    grouping: bsff.grouping,
    transporterCustomInfo: bsff["bsffTransporter"]?.customInfo,
    transporterNumberPlate: bsff["bsffTransporter"]?.transport?.plates,
    packagings: bsff?.packagings
  };
  return bsffFormatted;
};

export const mapBspaoh = (bspaoh: Bspaoh): BsdDisplay => {
  const statusCode = bspaoh?.status || bspaoh["bspaohStatus"];
  const wasteCode = bspaoh.waste?.code || bspaoh["bspaohWaste"]?.code;
  const wasteType = bspaoh.waste?.type || bspaoh["bspaohWaste"]?.type;
  const wasteName =
    wasteType === "FOETUS" ? "Foetus" : "Pièces anatomiques d'origine humaine";
  const bspaohFormatted: BsdDisplay = {
    id: bspaoh.id,
    readableid: bspaoh.id,
    type: mapBsdTypeNameToBsdType(bspaoh.__typename) || BsdType.Bsdasri,
    isDraft: bspaoh.isDraft,
    status: mapBsdStatusToBsdStatusEnum(statusCode),
    wasteDetails: {
      code: wasteCode,
      weight:
        bspaoh.destination?.reception?.detail?.acceptedWeight?.value ??
        bspaoh.emitter?.emission?.detail?.weight?.value,
      name: wasteName
    },
    emitter: bspaoh.emitter || bspaoh["bsdasriEmitter"],
    destination: bspaoh.destination || bspaoh["bsdasriDestination"],
    transporter: bspaoh.transporter || bspaoh["bsdasriTransporter"],

    updatedAt: bspaoh.updatedAt,

    bsdWorkflowType: BsdasriType.Simple, // currently there is no specific type on PAOH

    transporterCustomInfo: truncateTransporterInfo(
      bspaoh.transporter?.customInfo || bspaoh["bsdasriTransporter"]?.customInfo
    ),
    transporterNumberPlate:
      bspaoh.transporter?.transport?.plates ||
      bspaoh["bsdasriTransporter"]?.transport?.plates
  };
  return bspaohFormatted;
};
