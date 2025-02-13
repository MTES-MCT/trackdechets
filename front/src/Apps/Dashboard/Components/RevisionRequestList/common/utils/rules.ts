import {
  BsdasriStatus,
  BsdasriType,
  Packagings as BsddPackagingsType
} from "@td/codegen-ui";
import { BsdTypename } from "../../../../../common/types/bsdTypes";

export const revisionDasriRules = {
  "emitter.pickupSite": {
    revisable: [
      BsdasriStatus.Sent,
      BsdasriStatus.Received,
      BsdasriStatus.Processed,
      BsdasriStatus.AwaitingGroup
    ]
  },

  "waste.code": {
    revisable: [
      BsdasriStatus.Sent,
      BsdasriStatus.Received,
      BsdasriStatus.Processed,
      BsdasriStatus.AwaitingGroup
    ]
  },

  "destination.reception.packagings": {
    revisable: [
      BsdasriStatus.Received,
      BsdasriStatus.Processed,
      BsdasriStatus.AwaitingGroup
    ]
  },
  "destination.operation.code": {
    revisable: [BsdasriStatus.Processed, BsdasriStatus.AwaitingGroup]
  },

  "destination.operation.weight": {
    revisable: [BsdasriStatus.Processed, BsdasriStatus.AwaitingGroup]
  }
};

export const dasriNeverAvailableFields: Record<BsdasriType, string[]> = {
  [BsdasriType.Simple]: [],
  [BsdasriType.Grouping]: ["emitter.pickupSite"],
  [BsdasriType.Synthesis]: [
    "emitter.pickupSite",
    "waste.code",
    "destination.reception.packagings"
  ]
};

export const selectPackagingRules = (
  bsdType: BsdTypename,
  values,
  selectedOptionValue
) => {
  if (bsdType === BsdTypename.Bsdd) {
    return (
      values?.length > 1 &&
      ([BsddPackagingsType.Citerne, BsddPackagingsType.Benne].includes(
        selectedOptionValue
      ) ||
        values.some(p => {
          const optionValues =
            selectedOptionValue !== BsddPackagingsType.Autre
              ? [selectedOptionValue]
              : [];
          return [
            BsddPackagingsType.Citerne,
            BsddPackagingsType.Benne,
            [...optionValues]
          ].includes(p.type);
        }))
    );
  }
  return false;
};
