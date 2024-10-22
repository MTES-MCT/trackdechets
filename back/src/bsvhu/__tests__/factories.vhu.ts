import {
  BsvhuIdentificationType,
  BsvhuPackaging,
  Company,
  Prisma
} from "@prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../forms/readableId";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  ecoOrganismeFactory,
  siretify,
  userWithCompanyFactory
} from "../../__tests__/factories";
import { BsvhuForElastic, BsvhuForElasticInclude } from "../elastic";
import { getCanAccessDraftOrgIds } from "../utils";

export const bsvhuFactory = async ({
  userId,
  opt = {}
}: {
  userId?: string;
  opt?: Partial<Prisma.BsvhuCreateInput>;
}): Promise<BsvhuForElastic> => {
  const transporterCompany = await companyFactory({
    companyTypes: ["TRANSPORTER"]
  });
  const destinationCompany = await companyFactory({
    companyTypes: ["WASTE_VEHICLES"],
    wasteVehiclesTypes: ["BROYEUR", "DEMOLISSEUR"]
  });
  const nextDestinationCompany = await companyFactory({
    companyTypes: ["WASTE_VEHICLES"],
    wasteVehiclesTypes: ["BROYEUR"]
  });
  const brokerCompany = await companyFactory({
    companyTypes: ["BROKER"]
  });
  const traderCompany = await companyFactory({
    companyTypes: ["TRADER"]
  });
  const ecoOrganisme = await ecoOrganismeFactory({
    handle: { handleBsvhu: true },
    createAssociatedCompany: true
  });
  const bsvhuObject = getVhuFormdata();
  const userAndCompany = userId
    ? null
    : await userWithCompanyFactory("ADMIN", {
        siret: bsvhuObject.emitterCompanySiret,
        name: bsvhuObject.emitterCompanyName ?? undefined,
        address: bsvhuObject.emitterCompanyAddress ?? undefined,
        contact: bsvhuObject.emitterCompanyContact ?? undefined,
        contactPhone: bsvhuObject.emitterCompanyPhone ?? undefined,
        contactEmail: bsvhuObject.emitterCompanyMail ?? undefined
      });
  const created = await prisma.bsvhu.create({
    data: {
      ...bsvhuObject,
      transporterCompanySiret: transporterCompany.siret,
      destinationCompanySiret: destinationCompany.siret,
      destinationOperationNextDestinationCompanySiret:
        nextDestinationCompany.siret,
      ecoOrganismeSiret: ecoOrganisme.siret,
      brokerCompanySiret: brokerCompany.siret,
      traderCompanySiret: traderCompany.siret,
      ...opt
    },
    include: {
      intermediaries: true
    }
  });
  const intermediariesOrgIds: string[] = created.intermediaries
    ? created.intermediaries
        .flatMap(intermediary => [intermediary.siret, intermediary.vatNumber])
        .filter(Boolean)
    : [];

  // For drafts, only the owner's sirets that appear on the bsd have access
  const canAccessDraftOrgIds = await getCanAccessDraftOrgIds(
    created,
    (userId || userAndCompany?.user?.id) as string
  );

  return prisma.bsvhu.update({
    where: { id: created.id },
    data: {
      ...(canAccessDraftOrgIds.length ? { canAccessDraftOrgIds } : {}),
      ...(intermediariesOrgIds.length ? { intermediariesOrgIds } : {})
    },
    include: BsvhuForElasticInclude
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

  destinationOperationNextDestinationCompanyName: "Car crusher",
  destinationOperationNextDestinationCompanySiret: siretify(3),
  destinationOperationNextDestinationCompanyAddress:
    "12 rue des épavistes, Detroit",
  destinationOperationNextDestinationCompanyContact: "Jean l'opérateur",
  destinationOperationNextDestinationCompanyPhone: "06 07 08 09 10",
  destinationOperationNextDestinationCompanyMail: "operator@carcrusher.com",

  packaging: "UNITE" as BsvhuPackaging,
  identificationNumbers: ["1", "2", "3"],
  identificationType: "NUMERO_ORDRE_REGISTRE_POLICE" as BsvhuIdentificationType,
  quantity: 2,
  weightValue: 1.4,
  weightIsEstimate: true,

  transporterCompanyName: "Transport facile",
  transporterCompanySiret: siretify(4),
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
  destinationOperationCode: null,

  ecoOrganismeSiret: siretify(5),
  ecoOrganismeName: "Eco-Organisme",

  brokerCompanyName: "Courtier efficace",
  brokerCompanySiret: siretify(6),
  brokerCompanyAddress: "15 Rue des Lilas, 33000 Lille",
  brokerCompanyContact: "Anton Spencer",
  brokerCompanyPhone: "06 67 78 89 91",
  brokerCompanyMail: "a.spencer@goodbroker.com",
  brokerRecepisseNumber: "receipt number",
  brokerRecepisseDepartment: "33",
  brokerRecepisseValidityLimit: "2026-11-27T00:00:00.000Z",
  traderCompanyName: "Le Négoce QVB",
  traderCompanySiret: siretify(7),
  traderCompanyAddress: "32 Avenue des Azalées, 33700 Mérignac",
  traderCompanyContact: "Benjamin Turner",
  traderCompanyPhone: "06 68 35 64 34",
  traderCompanyMail: "b.turner@tradingalright.com",
  traderRecepisseNumber: "receipt of the firm",
  traderRecepisseDepartment: "33",
  traderRecepisseValidityLimit: "2026-11-28T00:00:00.000Z"
});

export const toIntermediaryCompany = (company: Company, contact = "toto") => ({
  siret: company.siret!,
  name: company.name,
  address: company.address,
  contact
});
