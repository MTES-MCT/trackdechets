import {
  BsvhuIdentificationType,
  BsvhuPackaging,
  Prisma
} from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { prisma } from "@td/prisma";
import { companyFactory, siretify } from "../../__tests__/factories";

export const bsvhuFactory = async ({
  opt = {}
}: {
  opt?: Partial<Prisma.BsvhuCreateInput>;
}) => {
  const transporterCompany = await companyFactory({
    companyTypes: ["TRANSPORTER"]
  });
  const destinationCompany = await companyFactory({
    companyTypes: ["WASTE_VEHICLES"]
  });
  return prisma.bsvhu.create({
    data: {
      ...getVhuFormdata(),
      transporterCompanySiret: transporterCompany.siret,
      destinationCompanySiret: destinationCompany.siret,
      ...opt
    }
  });
};

const getVhuFormdata = (): Prisma.BsvhuCreateInput => ({
  id: getReadableId(ReadableIdPrefix.VHU),
  emitterAgrementNumber: "agrement",
  emitterCompanyName: "emitter company",
  emitterCompanySiret: siretify(1),
  emitterCompanyAddress: "20 Avenue de l'Emitter, Emitter City",
  emitterCompanyContact: "Marc Martin",
  emitterCompanyPhone: "06 18 76 02 66",
  emitterCompanyMail: "recipient@td.io",

  destinationType: "BROYEUR",
  destinationPlannedOperationCode: "R 4",
  destinationAgrementNumber: "agrement recipient",
  destinationCompanyName: "I reveive waste INC",
  destinationCompanySiret: siretify(2),
  destinationCompanyAddress: "14 boulevard Recipient, Recipient City",
  destinationCompanyContact: "André Recipient",
  destinationCompanyPhone: "05 05 05 05 05",
  destinationCompanyMail: "recipient@td.io",

  packaging: "UNITE" as BsvhuPackaging,
  identificationNumbers: ["1", "2", "3"],
  identificationType: "NUMERO_ORDRE_REGISTRE_POLICE" as BsvhuIdentificationType,
  quantity: 2,
  weightValue: 1.4,
  weightIsEstimate: true,

  transporterCompanyName: "Transport facile",
  transporterCompanySiret: siretify(3),
  transporterCompanyAddress: "12 route du Transporter, Transporter City",
  transporterCompanyContact: "Henri Transport",
  transporterCompanyPhone: "06 06 06 06 06",
  transporterCompanyMail: "transporter@td.io",
  transporterRecepisseNumber: "a receipt",
  transporterRecepisseDepartment: "83",
  transporterRecepisseValidityLimit: "2019-11-27T00:00:00.000Z",

  destinationReceptionWeight: null,
  destinationReceptionAcceptationStatus: null,
  destinationReceptionRefusalReason: null,
  destinationOperationCode: null
});
