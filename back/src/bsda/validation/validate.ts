import { Bsda, BsdaStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { SIGNATURES_HIERARCHY } from "../edition";
import { getReadonlyBsdaRepository } from "../repository";
import { PARTIAL_OPERATIONS } from "../validation";
import { editionRules } from "./rules";
import { rawBsdaSchema, ZodBsda } from "./schema";

type BsdaValidationContext = {
  skipPreviousBsdas?: boolean;
  currentSignatureType: BsdaSignatureType | undefined;
};

export function getContextualBsdaSchema(
  validationContext: BsdaValidationContext
) {
  return rawBsdaSchema.superRefine(async (val, ctx) => {
    const arrayOfRules = Object.entries(editionRules);

    for (const [field, rule] of arrayOfRules) {
      // Some signatures may be skipped, so always check all the hierarchy
      const signaturesToCheck = getSignaturesLeadingToTarget(
        validationContext.currentSignatureType
      );

      // At first we apply refinement rules
      if (rule.superRefine instanceof Function) {
        rule.superRefine(val, ctx);
      }

      // Then we apply the required / no value rules. We skip those rules if the fields are not sealed yet
      if (!signaturesToCheck.includes(rule.sealedBy)) {
        continue;
      }

      const fieldIsRequired =
        rule.isRequired instanceof Function
          ? rule.isRequired(val)
          : rule.isRequired;

      if (fieldIsRequired && !val[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `TODO type & message => il faut une valeur`
        });
      }

      if (rule.isForbidden?.(val, fieldIsRequired) && val[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `TODO type & message => pas de valeur attendue mais on en a une`
        });
      }
    }

    const isForwarding = Boolean(val.forwarding);
    const isGrouping = Boolean(val.grouping?.length);

    if ([isForwarding, isGrouping].filter(b => b).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Les opérations d'entreposage provisoire et groupement ne sont pas compatibles entre elles"
      });
    }

    if (!validationContext.skipPreviousBsdas) {
      await validatePreviousBsdas(val, ctx);
    }

    await validateIntermediaries(val.intermediaries, ctx);
  });
}

function getSignaturesLeadingToTarget(
  targetSignature: BsdaSignatureType | undefined
) {
  if (!targetSignature) return [];

  const signaturesLeadingToTarget: BsdaSignatureType[] = [];
  let currentSignature: BsdaSignatureType = "EMISSION";

  while (currentSignature !== targetSignature) {
    signaturesLeadingToTarget.push(currentSignature);

    const nextSignature = SIGNATURES_HIERARCHY[currentSignature].next;
    if (!nextSignature) {
      throw new Error(
        `Signature hierarchy error. ${currentSignature} has no next singature but target isn't reached yet.`
      );
    }
    currentSignature = nextSignature;
  }

  return signaturesLeadingToTarget;
}

async function validateIntermediaries(
  intermediaries: ZodBsda["intermediaries"] | undefined,
  ctx: RefinementCtx
) {
  if (!intermediaries || intermediaries.length === 0) {
    return;
  }

  if (intermediaries.length > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Intermédiaires: impossible d'ajouter plus de 3 intermédiaires sur un BSDA",
      fatal: true
    });
    return z.NEVER;
  }

  const intermediaryIdentifiers = intermediaries.map(
    c => c.siret || c.vatNumber
  );
  const hasDuplicate =
    new Set(intermediaryIdentifiers).size !== intermediaryIdentifiers.length;
  if (hasDuplicate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Intermédiaires: impossible d'ajouter le même établissement en intermédiaire plusieurs fois",
      fatal: true
    });
    return z.NEVER;
  }

  for (const intermediary of intermediaries) {
    //await validateCompany(intermediary);
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
