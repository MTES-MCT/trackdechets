import { Bsda, BsdaStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import {
  isDestinationRefinement,
  isRegisteredVatNumberRefinement,
  isBsdaEcoOrganismeRefinement,
  isTransporterRefinement,
  isWorkerRefinement
} from "../../common/validation/siret";
import { getReadonlyBsdaRepository } from "../repository";
import { PARTIAL_OPERATIONS } from "./constants";
import { BsdaValidationContext } from "./index";
import { ZodBsda } from "./schema";
import { BsdaSignatureType } from "../../generated/graphql/types";

export async function applyDynamicRefinement(
  bsda: ZodBsda,
  validationContext: BsdaValidationContext,
  ctx: RefinementCtx
) {
  await applyFieldRefinement(
    isDestinationRefinement,
    "destinationCompanySiret",
    bsda,
    ctx
  );
  await applyFieldRefinement(
    isDestinationRefinement,
    "destinationOperationNextDestinationCompanySiret",
    bsda,
    ctx
  );
  await applyFieldRefinement(
    isRegisteredVatNumberRefinement,
    "transporterCompanyVatNumber",
    bsda,
    ctx
  );
  await applyFieldRefinement(
    isWorkerRefinement,
    "workerCompanySiret",
    bsda,
    ctx
  );
  await applyFieldRefinement(
    isBsdaEcoOrganismeRefinement,
    "ecoOrganismeSiret",
    bsda,
    ctx
  );

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

function applyFieldRefinement<T extends (value, ctx: RefinementCtx) => any>(
  refinement: T,
  field: keyof ZodBsda,
  bsda: ZodBsda,
  ctx: RefinementCtx
) {
  return refinement(bsda[field]!, {
    ...ctx,
    path: [...ctx.path, field]
  });
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

  if (
    // This rule only applies to BSDA that have not been signed before 2023-11-23
    (!bsda.emitterEmissionSignatureDate ||
      bsda.emitterEmissionSignatureDate >= new Date("2023-11-23")) &&
    bsda.type === "GATHERING" &&
    previousBsdasWithDestination.some(
      previousBsda => previousBsda.wasteCode !== bsda.wasteCode
    )
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Tous les bordereaux groupés doivent avoir le même code déchet que le bordereau de groupement.`,
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
  // Destination is freely editable until EMISSION signature.
  // Once transported, destination is not editable for anyone.
  // This is enforced by the sealing rules
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

  // If we remove a temporary destination, the final destination must remain the same
  if (
    currentBsda.destinationOperationNextDestinationCompanySiret &&
    !bsda.destinationOperationNextDestinationCompanySiret &&
    bsda.destinationCompanySiret !==
      currentBsda.destinationOperationNextDestinationCompanySiret
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Impossible de retirer un intermédiaire d'entreposage provisoire sans indiquer la destination finale prévue initialement comme destination.`,
      fatal: true
    });
  }
}
