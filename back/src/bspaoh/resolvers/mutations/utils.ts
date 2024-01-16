import { getFirstTransporterSync } from "../../converter";
import { PrismaBspaohWithTransporters, BspaohForParsing } from "../../types";
import { BspaohTransporter as PrismaBspaohTransporter } from "@prisma/client";

const emptyTransporter = {
  id: null,
  number: 1,

  transporterCompanyName: "",
  transporterCompanySiret: "",
  transporterCompanyVatNumber: "",
  transporterCompanyAddress: "",
  transporterCompanyContact: "",
  transporterCompanyPhone: "",
  transporterCompanyMail: "",

  transporterRecepisseNumber: null,
  transporterRecepisseDepartment: null,
  transporterRecepisseValidityLimit: null,
  transporterRecepisseIsExempted: null,

  transporterCustomInfo: "",

  transporterTransportPlates: [],
  transporterTransportMode: null,
  transporterTakenOverAt: null,
  transporterTransportSignatureDate: null,
  transporterTransportSignatureAuthor: null,
  bspaohId: null
};

export const prepareBspaohForParsing = (
  bspaoh: PrismaBspaohWithTransporters
): {
  preparedExistingBspaoh: BspaohForParsing;
  existingFirstTransporter: PrismaBspaohTransporter | null;
} => {
  const existingFirstTransporter = getFirstTransporterSync(bspaoh);
  const { transporters, ...existingBspaohWithoutTransporters } = bspaoh;

  const { id, bspaohId, ...cleanedFirstTransporter } =
    existingFirstTransporter || emptyTransporter;
  const preparedExistingBspaoh = {
    ...existingBspaohWithoutTransporters,
    ...cleanedFirstTransporter,
    transporters
  };

  return { preparedExistingBspaoh, existingFirstTransporter };
};
//todo: typer pour exhaustivite

export const prepareBspaohInputs = parsed => {
  const {
    transporterCompanyName,
    transporterCompanySiret,
    transporterCompanyVatNumber,
    transporterCompanyContact,
    transporterCompanyPhone,
    transporterCompanyMail,
    transporterCompanyAddress,
    transporterTransportPlates,
    transporterTransportMode,
    transporterRecepisseNumber,
    transporterRecepisseValidityLimit,
    transporterRecepisseDepartment,
    transporterRecepisseIsExempted,
    transporterCustomInfo,
    transporterTakenOverAt,
    transporterTransportSignatureDate,
    transporterTransportSignatureAuthor,

    ...preparedBspaohInput
  } = parsed;

  const preparedBspaohTransporterInput = {
    transporterCompanyName,
    transporterCompanySiret,
    transporterCompanyVatNumber,
    transporterCompanyContact,
    transporterCompanyPhone,
    transporterCompanyMail,
    transporterCompanyAddress,
    transporterRecepisseIsExempted,
    transporterTransportPlates,
    transporterRecepisseNumber,
    transporterRecepisseValidityLimit,
    transporterRecepisseDepartment,
    transporterCustomInfo,

    transporterTransportMode,
    transporterTakenOverAt
  };
  return { preparedBspaohInput, preparedBspaohTransporterInput };
};

export function getCurrentSignatureType(bspaoh: PrismaBspaohWithTransporters) {
  const firstTransporter = getFirstTransporterSync(bspaoh);
  if (bspaoh.destinationOperationSignatureDate != null) return "OPERATION";
  if (bspaoh.destinationReceptionSignatureDate != null) return "RECEPTION";
  if (bspaoh.handedOverToDestinationSignatureDate != null) return "DELIVERY";
  if (firstTransporter?.transporterTransportSignatureDate != null)
    return "TRANSPORT";
  if (bspaoh.emitterEmissionSignatureDate != null) return "EMISSION";
  return undefined;
}

export function getNextSignatureType(bspaoh: PrismaBspaohWithTransporters) {
  const firstTransporter = getFirstTransporterSync(bspaoh);
  if (bspaoh.destinationReceptionSignatureDate != null) return "OPERATION";
  if (firstTransporter?.transporterTransportSignatureDate != null)
    return "RECEPTION";
  if (bspaoh.emitterEmissionSignatureDate != null) return "TRANSPORT";
  return "EMISSION";
}
