import {
  BsvhuIdentificationType,
  BsvhuPackaging,
  Prisma
} from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import prisma from "../../prisma";

export const vhuFormFactory = async ({
  opt = {}
}: {
  opt?: Partial<Prisma.BsvhuFormCreateInput>;
}) => {
  const formParams = { ...getVhuFormdata(), ...opt };
  return prisma.bsvhuForm.create({
    data: {
      ...formParams
    }
  });
};

const getVhuFormdata = () => ({
  id: getReadableId(ReadableIdPrefix.VHU),
  emitterAgrementNumber: "agrement",
  emitterCompanyName: "emitter company",
  emitterCompanySiret: "15397456982146",
  emitterCompanyAddress: "20 Avenue de l'Emitter, Emitter City",
  emitterCompanyContact: "Marc Martin",
  emitterCompanyPhone: "06 18 76 02 66",
  emitterCompanyMail: "recipient@td.io",

  recipientOperationPlanned: "R 4",
  recipientAgrementNumber: "agrement recipient",
  recipientCompanyName: "I reveive waste INC",
  recipientCompanySiret: "13254678974589",
  recipientCompanyAddress: "14 boulevard Recipient, Recipient City",
  recipientCompanyContact: "André Recipient",
  recipientCompanyPhone: "05 05 05 05 05",
  recipientCompanyMail: "recipient@td.io",

  packaging: "UNITE" as BsvhuPackaging,
  identificationNumbers: ["1", "2", "3"],
  identificationType: "NUMERO_ORDRE_REGISTRE_POLICE" as BsvhuIdentificationType,
  quantityNumber: 2,
  quantityTons: 1.4,

  transporterCompanyName: "Transport facile",
  transporterCompanySiret: "12345678974589",
  transporterCompanyAddress: "12 route du Transporter, Transporter City",
  transporterCompanyContact: "Henri Transport",
  transporterCompanyPhone: "06 06 06 06 06",
  transporterCompanyMail: "transporter@td.io",
  transporterRecepisseNumber: "a receipt",
  transporterRecepisseDepartment: "83",
  transporterRecepisseValidityLimit: "2019-11-27T00:00:00.000Z",

  recipientAcceptanceQuantity: null,
  recipientAcceptanceStatus: null,
  recipientAcceptanceRefusalReason: null,
  recipientOperationDone: null
});
