import {
  BsddTransporter,
  EmitterType,
  Form,
  OperationMode,
  Prisma,
  RevisionRequestStatus,
  Status,
  User
} from "@prisma/client";
import * as yup from "yup";
import {
  PROCESSING_AND_REUSE_OPERATIONS_CODES,
  BSDD_WASTE_CODES,
  BSDD_APPENDIX1_WASTE_CODES,
  BSDD_SAMPLE_NUMBER_WASTE_CODES
} from "@td/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import { WeightUnits, weight, v20241101 } from "../../../common/validation";
import { prisma } from "@td/prisma";
import type {
  FormRevisionRequestContentInput,
  MutationCreateFormRevisionRequestArgs
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { getFormOrFormNotFound, getTransportersSync } from "../../database";
import {
  expandableFormIncludes,
  flattenBsddRevisionRequestInput,
  PrismaFormWithForwardedInAndTransporters
} from "../../converter";
import { checkCanRequestRevision } from "../../permissions";
import { getFormRepository } from "../../repository";
import { INVALID_PROCESSING_OPERATION, INVALID_WASTE_CODE } from "../../errors";
import {
  brokerSchemaFn,
  packagingInfoFn,
  quantityRefusedNotRequired,
  traderSchemaFn
} from "../../validation";
import { ForbiddenError, UserInputError } from "../../../common/errors";
import { getOperationModesFromOperationCode } from "../../../common/operationModes";
import { isDangerous } from "@td/constants";
import {
  canProcessDangerousWaste,
  canProcessNonDangerousWaste
} from "../../../companies/companyProfilesRules";
import { INVALID_DESTINATION_SUBPROFILE } from "../../errors";
import { isDefined } from "../../../common/helpers";

// If you modify this, also modify it in the frontend
export const CANCELLABLE_BSDD_STATUSES: Status[] = [
  // Status.DRAFT,
  // Status.SEALED,
  Status.SIGNED_BY_PRODUCER,
  Status.SENT,
  // Status.RECEIVED,
  // Status.ACCEPTED,
  // Status.PROCESSED,
  // Status.FOLLOWED_WITH_PNTTD,
  // Status.AWAITING_GROUP,
  // Status.GROUPED,
  // Status.NO_TRACEABILITY,
  // Status.REFUSED,
  Status.TEMP_STORED,
  Status.TEMP_STORER_ACCEPTED,
  Status.RESEALED,
  Status.SIGNED_BY_TEMP_STORER,
  Status.RESENT
  // Status.CANCELED,
];

export const NON_CANCELLABLE_BSDD_STATUSES: Status[] = Object.values(
  Status
).filter(status => !CANCELLABLE_BSDD_STATUSES.includes(status));

export type RevisionRequestContent = Pick<
  Prisma.BsddRevisionRequestCreateInput,
  | "isCanceled"
  | "recipientCap"
  | "wasteDetailsCode"
  | "wasteDetailsName"
  | "wasteDetailsPop"
  | "wasteDetailsPackagingInfos"
  | "quantityReceived"
  | "processingOperationDone"
  | "processingOperationDescription"
  | "brokerCompanyName"
  | "brokerCompanySiret"
  | "brokerCompanyAddress"
  | "brokerCompanyContact"
  | "brokerCompanyPhone"
  | "brokerCompanyMail"
  | "brokerReceipt"
  | "brokerDepartment"
  | "brokerValidityLimit"
  | "traderCompanyName"
  | "traderCompanySiret"
  | "traderCompanyAddress"
  | "traderCompanyContact"
  | "traderCompanyPhone"
  | "traderCompanyMail"
  | "traderReceipt"
  | "traderDepartment"
  | "traderValidityLimit"
  | "temporaryStorageTemporaryStorerQuantityReceived"
  | "temporaryStorageDestinationCap"
  | "temporaryStorageDestinationProcessingOperation"
>;

export default async function createFormRevisionRequest(
  _,
  { input }: MutationCreateFormRevisionRequestArgs,
  context: GraphQLContext
) {
  const {
    formId,
    content,
    comment,
    authoringCompanySiret: authoringCompanyOrgId
  } = input;

  const user = checkIsAuthenticated(context);
  const existingBsdd = await getFormOrFormNotFound(
    { id: formId },
    expandableFormIncludes
  );

  const formRepository = getFormRepository(user);

  await checkIfUserCanRequestRevisionOnBsdd(user, existingBsdd);

  // auto-complète les récépissés négociant et courtier
  const recipifiedContent = await recipify(content);

  const flatContent = await getFlatContent(recipifiedContent, existingBsdd);

  const history = getBsddHistory(existingBsdd);

  const authoringCompany = await getAuthoringCompany(
    user,
    existingBsdd,
    authoringCompanyOrgId
  );
  const approversSirets = await getApproversSirets(
    existingBsdd,
    flatContent,
    authoringCompany.orgId,
    user
  );

  return formRepository.createRevisionRequest({
    bsdd: { connect: { id: existingBsdd.id } },
    ...flatContent,
    authoringCompany: { connect: { id: authoringCompany.id } },
    approvals: {
      create: approversSirets.map(approverSiret => ({ approverSiret }))
    },
    comment,
    ...history
  });
}

async function getAuthoringCompany(
  user: Express.User,
  bsdd: PrismaFormWithForwardedInAndTransporters,
  authoringCompanyOrgId: string
) {
  const forwardedIn = await getFormRepository(user).findForwardedInById(
    bsdd.id
  );

  const transporterCanBeAuthor =
    bsdd.emitterType === EmitterType.APPENDIX1_PRODUCER && bsdd.takenOverAt;

  const transporterOrgIds = () =>
    getTransportersSync(bsdd)
      .flatMap(t => [t.transporterCompanySiret, t.transporterCompanyVatNumber])
      .filter(Boolean);

  const canBeAuthorCompany = [
    bsdd.emitterCompanySiret,
    bsdd.recipientCompanySiret,
    bsdd.ecoOrganismeSiret,
    forwardedIn?.recipientCompanySiret,
    ...(transporterCanBeAuthor ? transporterOrgIds() : [])
  ].filter(Boolean);

  if (!canBeAuthorCompany.includes(authoringCompanyOrgId)) {
    throw new UserInputError(
      `Le SIRET "${authoringCompanyOrgId}" ne peut pas être auteur de la révision.`
    );
  }

  const userCompanies = await getUserCompanies(user.id);
  const authoringCompany = userCompanies.find(
    company => company.orgId === authoringCompanyOrgId
  );

  if (!authoringCompany) {
    throw new UserInputError(
      `Vous n'avez pas les droits suffisants pour déclarer le SIRET "${authoringCompanyOrgId}" comme auteur de la révision.`
    );
  }

  return authoringCompany;
}

async function checkIfUserCanRequestRevisionOnBsdd(
  user: User,
  bsdd: Form
): Promise<void> {
  await checkCanRequestRevision(user, bsdd);

  if (Status.DRAFT === bsdd.status || Status.SEALED === bsdd.status) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Vous pouvez le modifier directement, aucune signature bloquante n'a encore été apposée."
    );
  }

  if (Status.REFUSED === bsdd.status || bsdd.isDeleted) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été refusé ou supprimé."
    );
  }

  if (bsdd.status === Status.CANCELED) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été annulé."
    );
  }

  const unsettledRevisionRequestsOnBsdd = await getFormRepository(
    user as Express.User
  ).countRevisionRequests({
    bsddId: bsdd.id,
    status: RevisionRequestStatus.PENDING
  });
  if (unsettledRevisionRequestsOnBsdd > 0) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Une autre révision est déjà en attente de validation."
    );
  }
}

async function validateWAsteAccordingToDestination(bsdd: Form, flatContent) {
  // do not run on existing bsdds created before release v20241101
  const bsddCreatedAt = bsdd.createdAt || new Date(); // new bsd do not have a createdAt yet
  const isCreatedAfterV202411011 =
    bsddCreatedAt.getTime() > v20241101.getTime();

  if (!isCreatedAfterV202411011) {
    return true;
  }

  const recipientCompany = await prisma.company.findUnique({
    where: { siret: bsdd.recipientCompanySiret! }
  });
  const hasDangerousWaste =
    isDangerous(flatContent.wasteDetailsCode || bsdd.wasteDetailsCode) ||
    flatContent.wasteDetailsPop ||
    bsdd.wasteDetailsPop ||
    flatContent.wasteDetailsIsDangerous ||
    bsdd.wasteDetailsIsDangerous;

  if (recipientCompany) {
    const canProcess = hasDangerousWaste
      ? canProcessDangerousWaste(recipientCompany)
      : canProcessNonDangerousWaste(recipientCompany);
    if (!canProcess) {
      throw new UserInputError(INVALID_DESTINATION_SUBPROFILE);
    }
  }
}
async function getFlatContent(
  content: FormRevisionRequestContentInput,
  bsdd: Form & { transporters: BsddTransporter[] }
): Promise<RevisionRequestContent> {
  const flatContent = flattenBsddRevisionRequestInput(content);

  const { isCanceled, ...revisionFields } = flatContent;

  // Retiré jusqu'à nouvel ordre!
  // Trying to change the acceptation status
  // if (content.wasteAcceptationStatus) {
  //   if (!bsdd.wasteAcceptationStatus) {
  //     throw new UserInputError(
  //       "Le statut d'acceptation des déchets n'est modifiable que s'il a déjà une valeur."
  //     );
  //   }

  //   if (
  //     content.wasteAcceptationStatus !== bsdd.wasteAcceptationStatus &&
  //     ![Status.ACCEPTED, Status.TEMP_STORER_ACCEPTED].includes(bsdd.status)
  //   ) {
  //     throw new UserInputError(
  //       "Le statut d'acceptation des déchets n'est modifiable que si le bordereau est au stade de la réception."
  //     );
  //   }
  // }

  if (!isCanceled && Object.keys(revisionFields).length === 0) {
    throw new UserInputError(
      "Impossible de créer une révision sans modifications."
    );
  }

  if (bsdd.forwardedInId == null && hasTemporaryStorageUpdate(flatContent)) {
    throw new UserInputError(
      "Impossible de réviser l'entreposage provisoire, ce bordereau n'est pas concerné."
    );
  }

  if (flatContent.isCanceled && Object.values(revisionFields).length > 0) {
    throw new UserInputError(
      "Impossible d'annuler et de modifier un bordereau."
    );
  }

  // One cannot request a CANCELATION on an appendix1
  if (flatContent.isCanceled && bsdd.emitterType === EmitterType.APPENDIX1) {
    throw new ForbiddenError(
      "Impossible d'annuler un bordereau de tournée dédiée."
    );
  }

  if (
    flatContent.isCanceled &&
    bsdd.emitterType === EmitterType.APPENDIX1_PRODUCER
  ) {
    throw new ForbiddenError("Impossible d'annuler un bordereau d'annexe 1'.");
  }

  // One cannot request a CANCELATION if the BSDD has advanced too far in the workflow
  if (
    flatContent.isCanceled &&
    NON_CANCELLABLE_BSDD_STATUSES.includes(bsdd.status)
  ) {
    throw new ForbiddenError(
      "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
    );
  }

  // If the BSD has been received, you can modify the quantityReceived. Else, no
  if (content.quantityReceived && !bsdd.receivedAt) {
    throw new ForbiddenError(
      "Impossible de réviser la quantité reçue si le bordereau n'a pas encore été réceptionné."
    );
  }

  // No more than 40 tons by ROAD transport
  if (
    content &&
    content?.quantityReceived &&
    content?.quantityReceived > 40 &&
    bsdd?.transporters?.length === 1 &&
    bsdd?.transporters[0]?.transporterTransportMode === "ROAD"
  ) {
    throw new ForbiddenError(
      "La quantité reçue ne peut dépasser 40 tonnes pour le transporter routier."
    );
  }

  await validateWAsteAccordingToDestination(bsdd, flatContent);

  const contentToValidate = getContentToValidate(bsdd, flatContent);

  if (bsdd.emitterType === EmitterType.APPENDIX1_PRODUCER) {
    await appendix1ProducerRevisionRequestSchema.validate(flatContent, {
      strict: true
    });

    if (
      flatContent.wasteDetailsSampleNumber &&
      bsdd.wasteDetailsCode &&
      !BSDD_SAMPLE_NUMBER_WASTE_CODES.includes(bsdd.wasteDetailsCode)
    ) {
      throw new ForbiddenError(
        "Impossible de saisir un numéro d'échantillon, le code déchet ne permet pas d'en avoir."
      );
    }
  } else {
    await bsddRevisionRequestSchema.validate(contentToValidate, {
      strict: true,
      abortEarly: false
    });
  }

  // Double-check the waste quantities
  await bsddRevisionRequestWasteQuantitiesSchema.validate({
    ...bsdd,
    ...contentToValidate
  });

  if (
    bsdd.emitterType === EmitterType.APPENDIX1 &&
    flatContent.wasteDetailsCode &&
    !BSDD_APPENDIX1_WASTE_CODES.includes(flatContent.wasteDetailsCode)
  ) {
    throw new ForbiddenError(
      "Impossible d'utiliser ce code déchet sur un bordereau de tournée d'annexe 1."
    );
  }

  return flatContent;
}

const getContentToValidate = (
  bsdd: Form & { transporters: BsddTransporter[] },
  flatContent: ReturnType<typeof flattenBsddRevisionRequestInput>
) => {
  // quantityReceived & quantityRefused sont liées pour la validation, il faut donc
  // passer les deux
  const isReviewingQuantities =
    isDefined(flatContent.quantityReceived) ||
    isDefined(flatContent.quantityRefused);

  let quantityReceived: number | null = null;
  let quantityRefused: number | null = null;

  if (isReviewingQuantities) {
    if (isDefined(flatContent.quantityReceived))
      quantityReceived = flatContent.quantityReceived;
    else if (isDefined(bsdd.quantityReceived))
      quantityReceived = Number(bsdd.quantityReceived);

    if (isDefined(flatContent.quantityRefused))
      quantityRefused = flatContent.quantityRefused;
    else if (isDefined(bsdd.quantityRefused))
      quantityRefused = Number(bsdd.quantityRefused);
  }

  // Idem for temp storage
  const isReviewingTempStorageQuantities =
    isDefined(flatContent.temporaryStorageTemporaryStorerQuantityReceived) ||
    isDefined(flatContent.temporaryStorageTemporaryStorerQuantityRefused);

  let temporaryStorageTemporaryStorerQuantityReceived: number | null = null;
  let temporaryStorageTemporaryStorerQuantityRefused: number | null = null;

  if (isReviewingTempStorageQuantities) {
    if (isDefined(flatContent.temporaryStorageTemporaryStorerQuantityReceived))
      temporaryStorageTemporaryStorerQuantityReceived =
        flatContent.temporaryStorageTemporaryStorerQuantityReceived;
    else if (isDefined(bsdd.quantityReceived))
      temporaryStorageTemporaryStorerQuantityReceived = Number(
        bsdd.quantityRefused
      );

    if (isDefined(flatContent.temporaryStorageTemporaryStorerQuantityRefused))
      temporaryStorageTemporaryStorerQuantityRefused =
        flatContent.temporaryStorageTemporaryStorerQuantityRefused;
    else if (isDefined(bsdd.quantityRefused))
      temporaryStorageTemporaryStorerQuantityRefused = Number(
        bsdd.quantityRefused
      );
  }

  return {
    ...flatContent,
    quantityReceived,
    quantityRefused,
    temporaryStorageTemporaryStorerQuantityReceived,
    temporaryStorageTemporaryStorerQuantityRefused
  };
};

async function getApproversSirets(
  bsdd: Form,
  content: RevisionRequestContent,
  authoringCompanySiret: string,
  user: Express.User
) {
  // do not include emitter and ecoOrg sirets if authoring company is one of them
  const authoringCompanyIsEmitterOrEcoOrg = [
    bsdd.emitterCompanySiret,
    bsdd.ecoOrganismeSiret
  ].includes(authoringCompanySiret);

  const approvers = [
    ...(authoringCompanyIsEmitterOrEcoOrg
      ? []
      : [bsdd.emitterCompanySiret, bsdd.ecoOrganismeSiret]),
    ...(bsdd.emitterType === EmitterType.APPENDIX1_PRODUCER
      ? [bsdd.currentTransporterOrgId]
      : [bsdd.recipientCompanySiret])
  ].filter(Boolean);

  if (hasTemporaryStorageUpdate(content)) {
    const forwardedIn = await getFormRepository(user).findForwardedInById(
      bsdd.id
    );

    if (forwardedIn?.recipientCompanySiret) {
      approvers.push(forwardedIn.recipientCompanySiret);
    }
  }

  const approversSirets = approvers.filter(
    siret => Boolean(siret) && siret !== authoringCompanySiret
  );

  // Remove duplicates
  return [...new Set(approversSirets)];
}

function hasTemporaryStorageUpdate(
  content: Pick<
    RevisionRequestContent,
    | "temporaryStorageDestinationCap"
    | "temporaryStorageDestinationProcessingOperation"
    | "temporaryStorageTemporaryStorerQuantityReceived"
  >
): boolean {
  return (
    content.temporaryStorageDestinationCap != null ||
    content.temporaryStorageDestinationProcessingOperation != null ||
    content.temporaryStorageTemporaryStorerQuantityReceived != null
  );
}

const bsddRevisionRequestWasteQuantitiesSchema = yup.object({
  // Retirés jusqu'à nouvel ordre!
  // wasteAcceptationStatus: yup.mixed<WasteAcceptationStatus>(),
  // wasteRefusalReason: yup
  //   .string()
  //   .when("wasteAcceptationStatus", (wasteAcceptationStatus, schema) =>
  //     ["REFUSED", "PARTIALLY_REFUSED"].includes(wasteAcceptationStatus)
  //       ? schema.ensure().required("Vous devez saisir un motif de refus")
  //       : schema
  //           .notRequired()
  //           .nullable()
  //           .test(
  //             "is-empty",
  //             "Le champ wasteRefusalReason ne doit pas être rensigné si le déchet est accepté ",
  //             v => !v
  //           )
  //   ),
  temporaryStorageTemporaryStorerQuantityReceived: yup
    .number()
    .min(0)
    .nullable(),
  temporaryStorageTemporaryStorerQuantityRefused: quantityRefusedNotRequired(
    "temporaryStorageTemporaryStorerQuantityReceived"
  ),
  quantityReceived: yup.number().min(0).nullable(),
  quantityRefused: quantityRefusedNotRequired()
});

async function recipify(
  content: FormRevisionRequestContentInput
): Promise<FormRevisionRequestContentInput> {
  let recipified = content;
  if (content.broker?.company?.siret) {
    const brokerCompany = await prisma.company.findFirst({
      where: { orgId: content.broker.company.siret },
      include: { brokerReceipt: true }
    });
    if (brokerCompany) {
      recipified = {
        ...recipified,
        broker: {
          ...recipified.broker,
          receipt: brokerCompany?.brokerReceipt?.receiptNumber ?? null,
          department: brokerCompany?.brokerReceipt?.department ?? null,
          validityLimit: brokerCompany?.brokerReceipt?.validityLimit ?? null
        }
      };
    }
  }
  if (content.trader?.company?.siret) {
    const traderCompany = await prisma.company.findFirst({
      where: { orgId: content.trader.company.siret },
      include: { traderReceipt: true }
    });
    if (traderCompany) {
      recipified = {
        ...recipified,
        trader: {
          ...recipified.trader,
          receipt: traderCompany?.traderReceipt?.receiptNumber ?? null,
          department: traderCompany?.traderReceipt?.department ?? null,
          validityLimit: traderCompany?.traderReceipt?.validityLimit ?? null
        }
      };
    }
  }
  return recipified;
}

const bsddRevisionRequestSchema: yup.SchemaOf<RevisionRequestContent> = yup
  .object({
    isCanceled: yup.bool().transform(v => (v === null ? false : v)),
    recipientCap: yup.string().nullable(),
    wasteDetailsCode: yup
      .string()
      .oneOf([...BSDD_WASTE_CODES, "", null], INVALID_WASTE_CODE),

    wasteDetailsName: yup.string().nullable(),
    wasteDetailsPop: yup.boolean().nullable(),
    wasteDetailsPackagingInfos: yup
      .array()
      .of(packagingInfoFn({ isDraft: false }))
      .transform(v => (v === null ? Prisma.JsonNull : v)),
    processingOperationDone: yup
      .string()
      .oneOf(
        PROCESSING_AND_REUSE_OPERATIONS_CODES,
        INVALID_PROCESSING_OPERATION
      )
      .nullable(),
    destinationOperationMode: yup
      .mixed<OperationMode | null | undefined>()
      .oneOf([...Object.values(OperationMode), null, undefined])
      .nullable()
      .test(
        "processing-mode-matches-processing-operation",
        "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie",
        function (item) {
          const { processingOperationDone } = this.parent;
          const destinationOperationMode = item;

          if (processingOperationDone) {
            const modes = getOperationModesFromOperationCode(
              processingOperationDone
            );

            if (modes.length) {
              if (!destinationOperationMode) {
                return new yup.ValidationError(
                  "Vous devez préciser un mode de traitement"
                );
              }

              return modes.includes(destinationOperationMode ?? "");
            }
          }

          return true;
        }
      ),
    processingOperationDescription: yup.string().nullable(),
    temporaryStorageDestinationCap: yup.string().nullable(),
    temporaryStorageDestinationProcessingOperation: yup
      .string()
      .oneOf(
        PROCESSING_AND_REUSE_OPERATIONS_CODES,
        INVALID_PROCESSING_OPERATION
      )
      .nullable()
  })
  .concat(bsddRevisionRequestWasteQuantitiesSchema)
  .concat(traderSchemaFn({ isDraft: false }))
  .concat(brokerSchemaFn({ isDraft: false }))
  .noUnknown(
    true,
    "Révision impossible, certains champs saisis ne sont pas modifiables"
  );

const appendix1ProducerRevisionRequestSchema = yup
  .object({
    isCanceled: yup.bool().transform(v => (v === null ? false : v)),
    wasteDetailsSampleNumber: yup.string().nullable(),
    wasteDetailsPackagingInfos: yup
      .array()
      .of(packagingInfoFn({ isDraft: false }))
      .transform(v => (v === null ? Prisma.JsonNull : v)),
    wasteDetailsQuantity: weight(WeightUnits.Tonne)
  })
  .noUnknown(
    true,
    "Révision impossible, certains champs saisis ne sont pas modifiables"
  );

function getBsddHistory(bsdd: Form & { forwardedIn: Form | null }) {
  return {
    initialRecipientCap: bsdd.recipientCap,
    initialWasteDetailsCode: bsdd.wasteDetailsCode,
    initialWasteDetailsName: bsdd.wasteDetailsName,
    initialWasteDetailsPop: bsdd.wasteDetailsPop,
    initialWasteDetailsPackagingInfos:
      bsdd.wasteDetailsPackagingInfos as Prisma.InputJsonValue,
    initialWasteAcceptationStatus: bsdd.wasteAcceptationStatus,
    initialWasteRefusalReason: bsdd.wasteRefusalReason,
    initialWasteDetailsSampleNumber: bsdd.wasteDetailsSampleNumber,
    initialWasteDetailsQuantity: bsdd.wasteDetailsQuantity,
    initialQuantityReceived: bsdd.quantityReceived,
    initialQuantityRefused: bsdd.quantityRefused,
    initialProcessingOperationDone: bsdd.processingOperationDone,
    initialDestinationOperationMode: bsdd.destinationOperationMode,
    initialProcessingOperationDescription: bsdd.processingOperationDescription,
    initialBrokerCompanyName: bsdd.brokerCompanyName,
    initialBrokerCompanySiret: bsdd.brokerCompanySiret,
    initialBrokerCompanyAddress: bsdd.brokerCompanyAddress,
    initialBrokerCompanyContact: bsdd.brokerCompanyContact,
    initialBrokerCompanyPhone: bsdd.brokerCompanyPhone,
    initialBrokerCompanyMail: bsdd.brokerCompanyMail,
    initialBrokerReceipt: bsdd.brokerReceipt,
    initialBrokerDepartment: bsdd.brokerDepartment,
    initialBrokerValidityLimit: bsdd.brokerValidityLimit,
    initialTraderCompanyName: bsdd.traderCompanyName,
    initialTraderCompanySiret: bsdd.traderCompanySiret,
    initialTraderCompanyAddress: bsdd.traderCompanyAddress,
    initialTraderCompanyContact: bsdd.traderCompanyContact,
    initialTraderCompanyPhone: bsdd.traderCompanyPhone,
    initialTraderCompanyMail: bsdd.traderCompanyMail,
    initialTraderReceipt: bsdd.traderReceipt,
    initialTraderDepartment: bsdd.traderDepartment,
    initialTraderValidityLimit: bsdd.traderValidityLimit,
    initialTemporaryStorageDestinationCap: bsdd.forwardedIn?.recipientCap,
    initialTemporaryStorageDestinationProcessingOperation:
      bsdd.forwardedIn?.processingOperationDone,
    initialTemporaryStorageTemporaryStorerQuantityReceived:
      bsdd.forwardedIn?.quantityReceived
  };
}
