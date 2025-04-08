import {
  Form,
  BsddTransporter,
  Prisma,
  TransportMode,
  WasteAcceptationStatus,
  IntermediaryFormAssociation,
  OperationMode,
  EmitterType
} from "@prisma/client";
import type {
  CiterneNotWashedOutReason,
  FormStatus,
  PackagingInfo
} from "@td/codegen-back";

export const FormWithTransportersInclude =
  Prisma.validator<Prisma.FormInclude>()({
    transporters: true
  });

export type FormWithTransporters = Prisma.FormGetPayload<{
  include: typeof FormWithTransportersInclude;
}>;

export const FormWithForwardedInInclude =
  Prisma.validator<Prisma.FormInclude>()({
    forwardedIn: true
  });

export type FormWithForwardedIn = Prisma.FormGetPayload<{
  include: typeof FormWithForwardedInInclude;
}>;

export const FormWithForwardedInWithTransportersInclude =
  Prisma.validator<Prisma.FormInclude>()({
    forwardedIn: { include: { transporters: true } }
  });

export type FormWithForwardedInWithTransporters = Prisma.FormGetPayload<{
  include: typeof FormWithForwardedInWithTransportersInclude;
}>;

export const FormWithIntermediariesInclude =
  Prisma.validator<Prisma.FormInclude>()({
    intermediaries: true
  });

export type FormWithIntermediaries = Prisma.FormGetPayload<{
  include: typeof FormWithIntermediariesInclude;
}>;

export const FormWithForwardingInclude = Prisma.validator<Prisma.FormInclude>()(
  {
    forwarding: true
  }
);

export type FormWithForwarding = Prisma.FormGetPayload<{
  include: typeof FormWithForwardingInclude;
}>;

export const BsddRevisionRequestWithAuthoringCompanyInclude =
  Prisma.validator<Prisma.BsddRevisionRequestInclude>()({
    authoringCompany: { select: { orgId: true } }
  });

export type BsddRevisionRequestWithAuthoringCompany =
  Prisma.BsddRevisionRequestGetPayload<{
    include: typeof BsddRevisionRequestWithAuthoringCompanyInclude;
  }>;

export const BsddRevisionRequestWithApprovalsInclude =
  Prisma.validator<Prisma.BsddRevisionRequestInclude>()({
    approvals: { select: { approverSiret: true } }
  });

export type BsddRevisionRequestWithApprovals =
  Prisma.BsddRevisionRequestGetPayload<{
    include: typeof BsddRevisionRequestWithApprovalsInclude;
  }>;

export const FormWithRevisionRequestsInclude =
  Prisma.validator<Prisma.FormInclude>()({
    bsddRevisionRequests: {
      include: {
        ...BsddRevisionRequestWithAuthoringCompanyInclude,
        ...BsddRevisionRequestWithApprovalsInclude
      }
    }
  });

export type FormWithRevisionRequests = Prisma.FormGetPayload<{
  include: typeof FormWithRevisionRequestsInclude;
}>;

export const FormWithAppendix1GroupingInfoInclude =
  Prisma.validator<Prisma.FormInclude>()({
    groupedIn: { select: { id: true } }
  });

export type FormWithAppendix1GroupingInfo = Prisma.FormGetPayload<{
  include: typeof FormWithAppendix1GroupingInfoInclude;
}>;

/**
 * A Prisma Form with linked objects
 * ***********************************
 *
 * NE PLUS UTILISER SI POSSIBLE
 *
 * Nouvelles conventions :
 *
 * Pour chaque fonction, on définit la forme attendue de l'objet Form
 * par un type spécifique que l'on définit juste au dessus de la fonction
 * à partir des petites "briques" définies au dessus et que l'on
 * nomme FormFor[NomDeLaFonction] ou autre chose du genre.
 * Dans le contexte appelant, on crée un include prisma en composant
 * les includes définit au dessus/
 *
 * Exemple :
 *
 * type FormForFoo = FormWithTransporters & FormWithIntermediaries
 *
 * function getFormForFoo(form: Form): Promise<FormForFoo> {
 *  return prisma.form.findUniqueOrThrow({
 *    where: {id: form.id },
 *    include: { ...FormWithTransportersInclude, ...FormWithIntermediariesInclude }
 *  })
 * }
 *
 * function foo(form: FormForFoo){
 *  /// function definition
 *  return form
 * }
 *
 * // Dans le contexte appelant
 *
 * const form = await getFormForFoo()
 *
 * foo(form)
 */
export interface FullForm extends Form {
  forwardedIn: (Form & { transporters: BsddTransporter[] }) | null;
  transporters: BsddTransporter[];
  intermediaries: IntermediaryFormAssociation[] | null;
}

// shape of a BSDD v2
export type Bsdd = {
  id: string;
  customId: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  isDraft: boolean;
  status: FormStatus;
  forwardedInId: string | null;
  isDirectSupply: boolean;
  pop: boolean | null;
  emitterType: EmitterType | null;
  ecoOrganismeName: string | null;
  ecoOrganismeSiret: string | null;
  emitterCompanyName: string | null;
  emitterCompanySiret: string | null;
  emitterCompanyAddress: string | null;
  emitterCompanyContact: string | null;
  emitterCompanyPhone: string | null;
  emitterCompanyMail: string | null;
  emitterCustomInfo: string | null;
  emitterPickupSiteName: string | null;
  emitterPickupSiteAddress: string | null;
  emitterPickupSiteCity: string | null;
  emitterPickupSitePostalCode: string | null;
  emitterPickupSiteInfos: string | null;
  emitterEmissionSignatureAuthor: string | null;
  emitterEmissionSignatureDate: Date | null;
  packagings: PackagingInfo[];
  wasteCode: string | null;
  wasteDescription: string | null;
  wasteDetailsLandIdentifiers: string[] | null;
  wasteAdr: string | null;
  nonRoadRegulationMention: string | null;
  wasteIsDangerous: boolean;
  weightValue: number | null;
  weightIsEstimate: boolean | null;
  transporterCompanyName: string | null;
  transporterCompanySiret: string | null;
  transporterCompanyVatNumber: string | null;
  transporterCompanyAddress: string | null;
  transporterCompanyContact: string | null;
  transporterCompanyPhone: string | null;
  transporterCompanyMail: string | null;
  transporterCustomInfo: string | null;
  transporterRecepisseIsExempted: boolean | null;
  transporterRecepisseNumber: string | null;
  transporterRecepisseDepartment: string | null;
  transporterRecepisseValidityLimit: Date | null;
  transporterTransportMode: TransportMode | null;
  transporterNumberPlates: string[] | null;
  transporterTransportTakenOverAt: Date | null;
  transporterTransportSignatureAuthor: string | null;
  transporterTransportSignatureDate: Date | null;
  transporter2CompanyName?: string | null;
  transporter2CompanySiret?: string | null;
  transporter2CompanyVatNumber?: string | null;
  transporter2CompanyAddress?: string | null;
  transporter2CompanyContact?: string | null;
  transporter2CompanyPhone?: string | null;
  transporter2CompanyMail?: string | null;
  transporter2CustomInfo?: string | null;
  transporter2RecepisseIsExempted?: boolean | null;
  transporter2RecepisseNumber?: string | null;
  transporter2RecepisseDepartment?: string | null;
  transporter2RecepisseValidityLimit?: Date | null;
  transporter2TransportMode?: TransportMode | null;
  transporter2NumberPlates?: string[] | null;
  transporter2TransportTakenOverAt?: Date | null;
  transporter2TransportSignatureAuthor?: string | null;
  transporter2TransportSignatureDate?: Date | null;
  transporter3CompanyName?: string | null;
  transporter3CompanySiret?: string | null;
  transporter3CompanyVatNumber?: string | null;
  transporter3CompanyAddress?: string | null;
  transporter3CompanyContact?: string | null;
  transporter3CompanyPhone?: string | null;
  transporter3CompanyMail?: string | null;
  transporter3CustomInfo?: string | null;
  transporter3RecepisseIsExempted?: boolean | null;
  transporter3RecepisseNumber?: string | null;
  transporter3RecepisseDepartment?: string | null;
  transporter3RecepisseValidityLimit?: Date | null;
  transporter3TransportMode?: TransportMode | null;
  transporter3NumberPlates?: string[] | null;
  transporter3TransportTakenOverAt?: Date | null;
  transporter3TransportSignatureAuthor?: string | null;
  transporter3TransportSignatureDate?: Date | null;
  transporter4CompanyName?: string | null;
  transporter4CompanySiret?: string | null;
  transporter4CompanyVatNumber?: string | null;
  transporter4CompanyAddress?: string | null;
  transporter4CompanyContact?: string | null;
  transporter4CompanyPhone?: string | null;
  transporter4CompanyMail?: string | null;
  transporter4CustomInfo?: string | null;
  transporter4RecepisseIsExempted?: boolean | null;
  transporter4RecepisseNumber?: string | null;
  transporter4RecepisseDepartment?: string | null;
  transporter4RecepisseValidityLimit?: Date | null;
  transporter4TransportMode?: TransportMode | null;
  transporter4NumberPlates?: string[] | null;
  transporter4TransportTakenOverAt?: Date | null;
  transporter4TransportSignatureAuthor?: string | null;
  transporter4TransportSignatureDate?: Date | null;
  transporter5CompanyName?: string | null;
  transporter5CompanySiret?: string | null;
  transporter5CompanyVatNumber?: string | null;
  transporter5CompanyAddress?: string | null;
  transporter5CompanyContact?: string | null;
  transporter5CompanyPhone?: string | null;
  transporter5CompanyMail?: string | null;
  transporter5CustomInfo?: string | null;
  transporter5RecepisseIsExempted?: boolean | null;
  transporter5RecepisseNumber?: string | null;
  transporter5RecepisseDepartment?: string | null;
  transporter5RecepisseValidityLimit?: Date | null;
  transporter5TransportMode?: TransportMode | null;
  transporter5NumberPlates?: string[] | null;
  transporter5TransportTakenOverAt?: Date | null;
  transporter5TransportSignatureAuthor?: string | null;
  transporter5TransportSignatureDate?: Date | null;
  traderCompanyName: string | null;
  traderCompanySiret: string | null;
  traderCompanyAddress: string | null;
  traderCompanyContact: string | null;
  traderCompanyPhone: string | null;
  traderCompanyMail: string | null;
  traderRecepisseNumber: string | null;
  traderRecepisseDepartment: string | null;
  traderRecepisseValidityLimit: Date | null;
  brokerCompanyName: string | null;
  brokerCompanySiret: string | null;
  brokerCompanyAddress: string | null;
  brokerCompanyContact: string | null;
  brokerCompanyPhone: string | null;
  brokerCompanyMail: string | null;
  brokerRecepisseNumber: string | null;
  brokerRecepisseDepartment: string | null;
  brokerRecepisseValidityLimit: Date | null;
  destinationCompanyName: string | null;
  destinationCompanySiret: string | null;
  destinationCompanyAddress: string | null;
  destinationCompanyContact: string | null;
  destinationCompanyPhone: string | null;
  destinationCompanyMail: string | null;
  destinationCustomInfo: string | null;
  destinationReceptionDate: Date | null;
  destinationReceptionWeight: number | null;
  destinationReceptionAcceptedWeight: number | null;
  destinationReceptionRefusedWeight: number | null;
  destinationReceptionAcceptationStatus: WasteAcceptationStatus | null;
  destinationReceptionRefusalReason: string | null;
  destinationReceptionSignatureAuthor: string | null;
  destinationReceptionSignatureDate: Date | null;
  destinationPlannedOperationCode: string | null;
  destinationOperationCode: string | null;
  destinationOperationMode: OperationMode | null;
  destinationOperationNoTraceability: boolean | null;
  destinationOperationNextDestinationCompanyName: string | null;
  destinationOperationNextDestinationCompanySiret: string | null;
  destinationOperationNextDestinationCompanyVatNumber: string | null;
  destinationOperationNextDestinationCompanyAddress: string | null;
  destinationOperationNextDestinationCompanyContact: string | null;
  destinationOperationNextDestinationCompanyPhone: string | null;
  destinationOperationNextDestinationCompanyMail: string | null;
  destinationHasCiterneBeenWashedOut: boolean | null;
  destinationCiterneNotWashedOutReason: CiterneNotWashedOutReason | null;
  destinationOperationSignatureAuthor: string | null;
  destinationOperationDate: Date | null;
  destinationOperationSignatureDate: Date | null;
  destinationCap: string | null;
  nextDestinationNotificationNumber: string | null;
  nextDestinationProcessingOperation: string | null;
  parcelCities: string[] | null;
  parcelPostalCodes: string[] | null;
  parcelInseeCodes: string[] | null;
  parcelNumbers: (string | null)[] | null;
  parcelCoordinates: (string | null)[] | null;
};
