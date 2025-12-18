import {
  Bsda,
  BsdaStatus,
  BsdaType,
  Prisma,
  RevisionRequestStatus
} from "@td/prisma";
import { z } from "zod";
import { ForbiddenError, UserInputError } from "../../../../common/errors";
import { checkIsAuthenticated } from "../../../../common/permissions";
import type {
  BsdaRevisionRequestContentInput,
  MutationCreateBsdaRevisionRequestArgs
} from "@td/codegen-back";
import { GraphQLContext } from "../../../../types";
import { getUserCompanies } from "../../../../users/database";
import { flattenBsdaRevisionRequestInput } from "../../../converter";
import { getBsdaOrNotFound } from "../../../database";
import { checkCanRequestRevision } from "../../../permissions";
import { getBsdaRepository } from "../../../repository";
import { rawBsdaSchema } from "../../../validation/schema";
import { bsdaEditionRules } from "../../../validation/rules";
import { capitalize } from "../../../../common/strings";
import { isBrokerRefinement } from "../../../../common/validation/zod/refinement";
import { prisma } from "@td/prisma";
import { checkDestinationReceptionRefusedWeight } from "../../../validation/refinements";
import { isDefined } from "../../../../common/helpers";
import { castD9toD9F } from "../../../validation/transformers";
import { getOperationModes } from "@td/constants";

// If you modify this, also modify it in the frontend
export const CANCELLABLE_BSDA_STATUSES: BsdaStatus[] = [
  // BsdaStatus.INITIAL,
  BsdaStatus.SIGNED_BY_PRODUCER,
  BsdaStatus.SIGNED_BY_WORKER,
  BsdaStatus.SENT
  // BsdaStatus.PROCESSED,
  // BsdaStatus.REFUSED,
  // BsdaStatus.AWAITING_CHILD,
  // BsdaStatus.CANCELED,
];

export const NON_CANCELLABLE_BSDA_STATUSES: BsdaStatus[] = Object.values(
  BsdaStatus
).filter(status => !CANCELLABLE_BSDA_STATUSES.includes(status));

const BSDA_REVISION_REQUESTER_FIELDS = [
  "emitterCompanySiret",
  "destinationCompanySiret",
  "workerCompanySiret",
  "ecoOrganismeSiret"
];

export type RevisionRequestContent = Pick<
  Prisma.BsdaRevisionRequestCreateInput,
  | "wasteCode"
  | "wastePop"
  | "packagings"
  | "wasteSealNumbers"
  | "wasteMaterialName"
  | "destinationCap"
  | "destinationReceptionWeight"
  | "destinationOperationCode"
  | "destinationOperationDescription"
  | "brokerCompanyName"
  | "brokerCompanySiret"
  | "brokerCompanyAddress"
  | "brokerCompanyContact"
  | "brokerCompanyPhone"
  | "brokerCompanyMail"
  | "brokerRecepisseNumber"
  | "brokerRecepisseDepartment"
  | "brokerRecepisseValidityLimit"
  | "emitterPickupSiteName"
  | "emitterPickupSiteAddress"
  | "emitterPickupSiteCity"
  | "emitterPickupSitePostalCode"
  | "emitterPickupSiteInfos"
  | "isCanceled"
>;

export async function createBsdaRevisionRequest(
  _,
  { input }: MutationCreateBsdaRevisionRequestArgs,
  context: GraphQLContext
) {
  const { bsdaId, content, comment, authoringCompanySiret } = input;

  const user = checkIsAuthenticated(context);
  const bsda = await getBsdaOrNotFound(bsdaId);

  const bsdaRepository = getBsdaRepository(user);

  await checkIfUserCanRequestRevisionOnBsda(user, bsda);
  const authoringCompany = await getAuthoringCompany(
    user,
    bsda,
    authoringCompanySiret
  );

  if (!authoringCompany.siret) {
    throw new Error(
      `Authoring company ${authoringCompany.id} has no siret. Cannot create BSDA revision request.`
    );
  }
  const recipified = await recipify(content);
  const flatContent = await getFlatContent(recipified, bsda);

  const approversSirets = await getApproversSirets(
    flatContent,
    bsda,
    authoringCompany.siret
  );

  const history = getBsdaHistory(bsda);

  return bsdaRepository.createRevisionRequest({
    bsda: { connect: { id: bsda.id } },
    ...flatContent,
    authoringCompany: { connect: { id: authoringCompany.id } },
    approvals: {
      create: approversSirets.map(approverSiret => ({ approverSiret }))
    },
    comment,
    ...history
  });
}

async function checkIfUserCanRequestRevisionOnBsda(
  user: Express.User,
  bsda: Bsda
): Promise<void> {
  await checkCanRequestRevision(user, bsda);

  if (bsda.status === BsdaStatus.INITIAL) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Vous pouvez le modifier directement, aucune signature bloquante n'a encore été apposée."
    );
  }

  if (bsda.status === BsdaStatus.REFUSED || bsda.isDeleted) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été refusé ou supprimé."
    );
  }

  if (bsda.status === BsdaStatus.CANCELED) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau, il a été annulé."
    );
  }

  const unsettledRevisionRequestsOnbsda = await getBsdaRepository(
    user
  ).countRevisionRequests({
    bsdaId: bsda.id,
    status: RevisionRequestStatus.PENDING
  });
  if (unsettledRevisionRequestsOnbsda > 0) {
    throw new ForbiddenError(
      "Impossible de créer une révision sur ce bordereau. Une autre révision est déjà en attente de validation."
    );
  }
}

export const isOnlyAboutFields = (
  revisionRequestContent: RevisionRequestContent,
  fields: string[]
) => {
  return (
    Object.keys(revisionRequestContent).filter(field => !fields.includes(field))
      .length === 0
  );
};

async function getApproversSirets(
  revisionRequestContent: RevisionRequestContent,
  bsda: Bsda,
  authoringCompanySiret: string
) {
  // Requesters and approvers are the same persona
  let approversSirets = BSDA_REVISION_REQUESTER_FIELDS.map(
    field => bsda[field]
  ).filter(siret => Boolean(siret) && siret !== authoringCompanySiret);

  // Si la révision ne concerne QUE les champs wasteSealNumbers et/ou packagings,
  // l'approbation de l'émetteur n'est pas nécessaire
  if (
    bsda.type === BsdaType.OTHER_COLLECTIONS &&
    !revisionRequestContent.isCanceled &&
    isOnlyAboutFields(revisionRequestContent, [
      "wasteSealNumbers",
      "packagings",
      "isCanceled" // isCanceled est envoyé systématiquement par le front
    ]) &&
    (authoringCompanySiret === bsda.workerCompanySiret ||
      authoringCompanySiret === bsda.destinationCompanySiret)
  ) {
    approversSirets = approversSirets.filter(
      siret => siret !== bsda.emitterCompanySiret
    );
  }

  // Remove duplicates
  return [...new Set(approversSirets)];
}

async function getAuthoringCompany(
  user: Express.User,
  bsda: Bsda,
  authoringCompanySiret: string
) {
  const siretConcernedByRevision = BSDA_REVISION_REQUESTER_FIELDS.map(
    field => bsda[field]
  );

  if (!siretConcernedByRevision.includes(authoringCompanySiret)) {
    throw new UserInputError(
      `Le SIRET "${authoringCompanySiret}" ne peut pas être auteur de la révision. Il n'apparait pas avec un rôle lui donnant ce droit sur le bordereau.`
    );
  }

  const userCompanies = await getUserCompanies(user.id);
  const authoringCompany = userCompanies.find(
    company => company.siret === authoringCompanySiret
  );

  if (!authoringCompany) {
    throw new UserInputError(
      `Vous n'avez pas les droits suffisants pour déclarer le SIRET "${authoringCompanySiret}" comme auteur de la révision.`
    );
  }

  return authoringCompany;
}

async function getFlatContent(
  content: BsdaRevisionRequestContentInput,
  bsda: Bsda
);
async function getFlatContent(
  content: BsdaRevisionRequestContentInput,
  bsda: Bsda
): Promise<RevisionRequestContent> {
  const flatContent = flattenBsdaRevisionRequestInput(content);
  const { isCanceled, ...fields } = flatContent;

  if (!isCanceled && Object.keys(fields).length === 0) {
    throw new UserInputError(
      "Impossible de créer une révision sans modifications."
    );
  }

  if (isCanceled && Object.values(fields).length > 0) {
    throw new UserInputError(
      "Impossible d'annuler et de modifier un bordereau."
    );
  }

  // One cannot request a CANCELATION if the BSDA has advanced too far in the workflow
  if (isCanceled && NON_CANCELLABLE_BSDA_STATUSES.includes(bsda.status)) {
    throw new ForbiddenError(
      "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
    );
  }

  const contentToValidate = { ...flatContent };

  // If the user modifies either the operation code or the operation mode,
  // we need to make sure both fields are present for the validation
  if (
    isDefined(flatContent.destinationOperationCode) ||
    isDefined(flatContent.destinationOperationMode)
  ) {
    contentToValidate.destinationOperationCode =
      flatContent.destinationOperationCode ?? bsda.destinationOperationCode;
    contentToValidate.destinationOperationMode =
      flatContent.destinationOperationMode ?? bsda.destinationOperationMode;
  }

  const parsed = await schema
    // For the refused weight, we need the bsda previous state
    .superRefine((contentToValidate, ctx) =>
      checkDestinationReceptionRefusedWeight(
        { ...bsda, ...contentToValidate },
        ctx
      )
    )
    .parseAsync(contentToValidate); // Validate but don't parse as we want to keep empty fields empty

  if (parsed.destinationOperationCode || parsed.destinationOperationMode) {
    flatContent.destinationOperationCode = parsed.destinationOperationCode;
    flatContent.destinationOperationMode = parsed.destinationOperationMode;
  }

  return flatContent;
}

const schema = rawBsdaSchema
  .pick({
    wasteCode: true,
    wastePop: true,
    wasteSealNumbers: true,
    wasteMaterialName: true,
    packagings: true,
    destinationCap: true,
    destinationOperationCode: true,
    destinationOperationMode: true,
    destinationOperationDescription: true,
    destinationReceptionWeight: true,
    destinationReceptionRefusedWeight: true,
    brokerCompanyName: true,
    brokerCompanySiret: true,
    brokerCompanyAddress: true,
    brokerCompanyContact: true,
    brokerCompanyPhone: true,
    brokerCompanyMail: true,
    brokerRecepisseNumber: true,
    brokerRecepisseDepartment: true,
    brokerRecepisseValidityLimit: true,
    emitterPickupSiteName: true,
    emitterPickupSiteAddress: true,
    emitterPickupSiteCity: true,
    emitterPickupSitePostalCode: true,
    emitterPickupSiteInfos: true
  })
  .extend({ isCanceled: z.boolean().nullish() })
  .transform(castD9toD9F)
  .superRefine((val, ctx) => {
    const { destinationOperationCode, destinationOperationMode } = val;
    if (destinationOperationCode) {
      const modes = getOperationModes(destinationOperationCode);

      if (modes.length && !destinationOperationMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vous devez préciser un mode de traitement"
        });
      } else if (
        (modes.length &&
          destinationOperationMode &&
          !modes.includes(destinationOperationMode)) ||
        (!modes.length && destinationOperationMode)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
        });
      }
    }

    // The difference with the raw bsda schema is that most fields must not be empty
    const nonEmptyFields = [
      "wasteCode",
      "wastePop",
      "wasteSealNumbers",
      "wasteMaterialName",
      "packagings",
      "destinationCap",
      "destinationOperationCode",
      // "destinationOperationMode",
      "destinationOperationDescription",
      "destinationReceptionWeight"
    ] as const;
    for (const field of nonEmptyFields) {
      if (field in val && val[field] === null) {
        const readableFieldName = bsdaEditionRules[field].readableFieldName;
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${
            readableFieldName ? capitalize(readableFieldName) : field
          } ne peut pas être vide`
        });
      }
    }
  })
  .superRefine(async (bsda, zodContext) => {
    await isBrokerRefinement(bsda.brokerCompanySiret, zodContext);
    if (
      bsda.brokerCompanySiret &&
      (!bsda.brokerRecepisseNumber ||
        !bsda.brokerRecepisseDepartment ||
        !bsda.brokerRecepisseValidityLimit)
    ) {
      zodContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["broker", "recepisse"],
        message: `Le courtier n'a pas renseigné de récépissé sur son profil Trackdéchets`
      });
    }
  });

function getBsdaHistory(bsda: Bsda) {
  return {
    initialWasteCode: bsda.wasteCode,
    initialWastePop: bsda.wastePop,
    initialPackagings: bsda.packagings,
    initialWasteSealNumbers: bsda.wasteSealNumbers,
    initialWasteMaterialName: bsda.wasteMaterialName,
    // Attention: on révise le CAP de l'exutoire, jamais du TTR
    initialDestinationCap:
      bsda.destinationOperationNextDestinationCap ?? bsda.destinationCap,
    initialDestinationReceptionWeight: bsda.destinationReceptionWeight,
    initialDestinationReceptionRefusedWeight:
      bsda.destinationReceptionRefusedWeight,
    initialDestinationOperationCode: bsda.destinationOperationCode,
    initialDestinationOperationDescription:
      bsda.destinationOperationDescription,
    initialDestinationOperationMode: bsda.destinationOperationMode,
    initialBrokerCompanyName: bsda.brokerCompanyName,
    initialBrokerCompanySiret: bsda.brokerCompanySiret,
    initialBrokerCompanyAddress: bsda.brokerCompanyAddress,
    initialBrokerCompanyContact: bsda.brokerCompanyContact,
    initialBrokerCompanyPhone: bsda.brokerCompanyPhone,
    initialBrokerCompanyMail: bsda.brokerCompanyMail,
    initialBrokerRecepisseNumber: bsda.brokerRecepisseNumber,
    initialBrokerRecepisseDepartment: bsda.brokerRecepisseDepartment,
    initialBrokerRecepisseValidityLimit: bsda.brokerRecepisseValidityLimit,
    initialEmitterPickupSiteName: bsda.emitterPickupSiteName,
    initialEmitterPickupSiteAddress: bsda.emitterPickupSiteAddress,
    initialEmitterPickupSiteCity: bsda.emitterPickupSiteCity,
    initialEmitterPickupSitePostalCode: bsda.emitterPickupSitePostalCode,
    initialEmitterPickupSiteInfos: bsda.emitterPickupSiteInfos
  };
}

async function recipify(
  content: BsdaRevisionRequestContentInput
): Promise<BsdaRevisionRequestContentInput> {
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
          recepisse: {
            number: brokerCompany?.brokerReceipt?.receiptNumber ?? null,
            department: brokerCompany?.brokerReceipt?.department ?? null,
            validityLimit: brokerCompany?.brokerReceipt?.validityLimit ?? null
          }
        }
      };
    }
  }

  return recipified;
}
