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
      BsdasriStatus.Processed
    ]
  },

  "waste.code": {
    revisable: [
      BsdasriStatus.Sent,
      BsdasriStatus.Received,
      BsdasriStatus.Processed
    ]
  },

  "destination.reception.packagings": {
    revisable: [BsdasriStatus.Received, BsdasriStatus.Processed]
  },
  "destination.operation.code": {
    revisable: [BsdasriStatus.Processed]
  },

  "destination.operation.weight": {
    revisable: [BsdasriStatus.Processed]
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
        values.some(p =>
          [
            BsddPackagingsType.Citerne,
            BsddPackagingsType.Benne,
            ...(selectedOptionValue !== BsddPackagingsType.Autre
              ? [selectedOptionValue]
              : [])
          ].includes(p.type)
        ))
    );
  }
  return false;
};

export const disableAddPackagingCta = packagingInfos => {
  const arr = packagingInfos!.filter(
    p =>
      ![BsddPackagingsType.Citerne, BsddPackagingsType.Benne].includes(p.type)
  );
  const rule = packagingInfos?.length! > 0 && arr.length === 0;

  return rule;
};
