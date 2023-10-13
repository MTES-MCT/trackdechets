import { Bsda, BsdaStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { isTransporterRefinement } from "../../common/validation/siret";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { getReadonlyBsdaRepository } from "../repository";
import { PARTIAL_OPERATIONS } from "./constants";
import { BsdaValidationContext } from "./index";
import { ZodBsda } from "./schema";

export async function applyContextualAndAsyncRefinement(
  bsda: ZodBsda,
  validationContext: BsdaValidationContext,
  ctx: RefinementCtx
) {
  validatePlates(bsda, validationContext.currentSignatureType, ctx);

  await isTransporterRefinement(
    {
      siret: bsda.transporterCompanySiret,
      transporterRecepisseIsExempted: bsda.transporterRecepisseIsExempted
    },
    ctx
  );

  if (validationContext.enablePreviousBsdasChecks) {
    await validatePreviousBsdas(bsda, ctx);
  }

  await validateDestination(bsda, validationContext.currentSignatureType, ctx);
}

function validatePlates(
  bsda: ZodBsda,
  currentSignatureType: BsdaSignatureType | undefined,
  ctx: RefinementCtx
) {
  // Plates are mandatory at transporter signature's step
  if (currentSignatureType !== "TRANSPORT") {
    return;
  }
  const { transporterTransportMode, transporterTransportPlates } = bsda;

  if (
    transporterTransportMode === "ROAD" &&
    (!transporterTransportPlates ||
      !transporterTransportPlates?.filter(p => Boolean(p)).length)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La plaque d'immatriculation est requise",
      path: ["transporterTransportPlates"]
    });
  }
}

async function validatePreviousBsdas(bsda: ZodBsda, ctx: RefinementCtx) {
  if (!["GATHERING", "RESHIPMENT"].includes(bsda.type)) {
    return;
  }

  const { findMany } = getReadonlyBsdaRepository();
  const previousIds = [bsda.forwarding, ...(bsda.grouping ?? [])].filter(
    Boolean
  ) as string[];
  const previousBsdas = await findMany(
    { id: { in: previousIds } },
    {
      include: {
        forwardedIn: true,
        groupedIn: true
      }
    }
  );

  if (previousBsdas.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Un bordereau de groupement ou de réexpédition doit obligatoirement être associé à au moins un bordereau.",
      fatal: true
    });
    return z.NEVER;
  }

  const previousBsdasWithDestination = previousBsdas.filter(
    previousBsda => previousBsda.destinationCompanySiret
  );
  if (
    bsda.emitterCompanySiret &&
    previousBsdasWithDestination.some(
      previousBsda =>
        previousBsda.destinationCompanySiret !== bsda.emitterCompanySiret
    )
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Certains des bordereaux à associer ne sont pas en la possession du nouvel émetteur.`,
      fatal: true
    });
    return z.NEVER;
  }

  const nextDestinations = previousBsdas.map(
    bsda => bsda.destinationOperationNextDestinationCompanySiret
  );
  if (!nextDestinations.every(siret => siret === nextDestinations[0])) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Certains des bordereaux à associer ont des exutoires différents. Ils ne peuvent pas être groupés ensemble.`,
      fatal: true
    });
    return z.NEVER;
  }

  const firstPreviousBsdaWithDestination = previousBsdasWithDestination[0];
  if (
    previousBsdasWithDestination.some(
      previousBsda =>
        previousBsda.destinationCompanySiret !==
        firstPreviousBsdaWithDestination.destinationCompanySiret
    )
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Certains des bordereaux à associer ne sont pas en possession du même établissement.`,
      fatal: true
    });
    return z.NEVER;
  }

  for (const previousBsda of previousBsdas) {
    if (previousBsda.status === BsdaStatus.PROCESSED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le bordereau n°${previousBsda.id} a déjà reçu son traitement final.`,
        fatal: true
      });
      continue;
    }

    if (previousBsda.status !== BsdaStatus.AWAITING_CHILD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le bordereau n°${previousBsda.id} n'a pas toutes les signatures requises.`,
        fatal: true
      });
      continue;
    }

    const { forwardedIn, groupedIn } = previousBsda;
    // nextBsdas of previous
    const nextBsdas = [forwardedIn, groupedIn].filter(Boolean) as Bsda[];
    if (
      nextBsdas.length > 0 &&
      !nextBsdas.map(bsda => bsda.id).includes(bsda.id)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le bordereau n°${previousBsda.id} a déjà été réexpédié ou groupé.`,
        fatal: true
      });
      continue;
    }

    if (
      !PARTIAL_OPERATIONS.some(
        op => op === previousBsda.destinationOperationCode
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le bordereau n°${previousBsda.id} a déclaré un traitement qui ne permet pas de lui donner la suite voulue.`,
        fatal: true
      });
    }
  }
}

/**
 * Destination is editable until TRANSPORT.
 * But afer EMISSION, if you change the destination, the current destination must become the nextDestination.
 *
 * @param bsda
 * @param currentSignatureType
 * @param ctx
 */
async function validateDestination(
  bsda: ZodBsda,
  currentSignatureType: BsdaSignatureType | undefined,
  ctx: RefinementCtx
) {
  // If the bsda has no signature, fields are freeely editable.
  // If the bsda is already transported, fields are not editable.
  if (
    currentSignatureType === undefined ||
    currentSignatureType === "OPERATION"
  ) {
    return;
  }

  const { findUnique } = getReadonlyBsdaRepository();
  const currentBsda = await findUnique({ id: bsda.id });

  if (!currentBsda) {
    return;
  }

  // If we add a temporary destination, the final destination must remain the same
  if (
    currentBsda.destinationCompanySiret !== bsda.destinationCompanySiret &&
    bsda.destinationOperationNextDestinationCompanySiret &&
    bsda.destinationOperationNextDestinationCompanySiret !==
      currentBsda.destinationCompanySiret
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Impossible d'ajouter un intermédiaire d'entreposage provisoire sans indiquer la destination prévue initialement comme destination finale.`,
      fatal: true
    });
  }
}
