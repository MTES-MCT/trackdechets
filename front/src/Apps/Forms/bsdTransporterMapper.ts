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

export const mapBsdTransporter = (
  transporter: AnyTransporterInput,
  bsdType: BsdType
): BsdTransporterInput | null => {
  switch (bsdType) {
    case BsdType.Bsdd:
      return mapBsddTransporter(transporter);
    default:
      return transporter;
  }
  return null;
};
