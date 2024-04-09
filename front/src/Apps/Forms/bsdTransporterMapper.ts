import { CreateOrUpdateBsdaTransporterInput } from "../../form/bsda/stepper/initial-state";
import { CreateOrUpdateTransporterInput } from "../../form/bsdd/utils/initial-state";
import { AnyTransporterInput, BsdTransporterInput } from "./types";
import { BsdType } from "@td/codegen-ui";

export const mapBsddTransporter = (
  transporter: CreateOrUpdateTransporterInput
): BsdTransporterInput => {
  return {
    id: transporter.id,
    takenOverAt: transporter.takenOverAt,
    company: transporter.company,
    recepisse: {
      isExempted: transporter.isExemptedOfReceipt,
      validityLimit: transporter.validityLimit,
      department: transporter.department,
      number: transporter.receipt
    },
    transport: {
      mode: transporter.mode,
      plates: transporter.numberPlate ? [transporter.numberPlate] : []
    }
  };
};

export const mapBsdaTransporter = (
  transporter: CreateOrUpdateBsdaTransporterInput
): BsdTransporterInput => {
  return transporter;
};

export const mapBsdTransporter = (
  transporter: AnyTransporterInput,
  bsdType: BsdType
): BsdTransporterInput | null => {
  switch (bsdType) {
    case BsdType.Bsdd:
      return mapBsddTransporter(transporter);
    case BsdType.Bsda:
      return mapBsdaTransporter(transporter);
  }
  return null;
};
