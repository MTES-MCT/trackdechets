import { Bsda, BsdaStatus } from "@prisma/client";
import { RefinementCtx, z } from "zod";
import { BsdaSignatureType } from "../../generated/graphql/types";
import { SIGNATURES_HIERARCHY } from "./edition";
import { getReadonlyBsdaRepository } from "../repository";
import { sirenify } from "./sirenify";
import { PARTIAL_OPERATIONS } from "./constants";
import { editionRules } from "./rules";
import { ZodBsda, rawBsdaSchema } from "./schema";
import { capitalize } from "../../common/strings";
import { runTransformers } from "./transformers";

type BsdaValidationContext = {
  enablePreviousBsdasChecks?: boolean;
  enableSirenification?: boolean;
  currentSignatureType?: BsdaSignatureType;
};

export async function parseBsda(
  bsda: unknown,
  validationContext: BsdaValidationContext = {}
): Promise<ZodBsda> {
  const contextualSchema = getContextualBsdaSchema(validationContext);

  return contextualSchema.parseAsync(bsda);
}

function getContextualBsdaSchema(validationContext: BsdaValidationContext) {
  return rawBsdaSchema
    .transform(async val => {
      val.intermediariesOrgIds = val.intermediaries
        ? val.intermediaries
            .flatMap(intermediary => [
              intermediary.siret,
              intermediary.vatNumber
            ])
            .filter(Boolean)
        : undefined;

      if (validationContext.enableSirenification) {
        val = await sirenify(val);
      }

      val = await runTransformers(val);

      return val;
    })
    .superRefine(async (val, ctx) => {
      // Some signatures may be skipped, so always check all the hierarchy
      const signaturesToCheck = getSignatureHierarchy(
        validationContext.currentSignatureType
      );

      // We skip the rules for which the fields are not sealed yet
      const sealedRules = Object.entries(editionRules).filter(([_, rule]) =>
        signaturesToCheck.includes(rule.sealedBy)
      );

      // Fields validation
      for (const [field, rule] of sealedRules) {
        if (rule.superRefineWhenSealed instanceof Function) {
          // @ts-expect-error TODO: superRefineWhenSealed first param is inferred as never ?
          rule.superRefineWhenSealed(val[field], ctx);
        }

        const fieldIsRequired =
          rule.isRequired instanceof Function
            ? rule.isRequired(val)
            : rule.isRequired;

        if (fieldIsRequired && val[field] == null) {
          const description = rule.name
            ? capitalize(rule.name)
            : `Le champ ${field}`;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${description} est obligatoire.`
          });
        }
      }

      // Custom validation, not part of the schema because it depends on the validationContext
      if (validationContext.enablePreviousBsdasChecks) {
        await validatePreviousBsdas(val, ctx);
      }
    });
}

function getSignatureHierarchy(
  targetSignature: BsdaSignatureType | undefined
): BsdaSignatureType[] {
  if (!targetSignature) return [];

  const parent = Object.entries(SIGNATURES_HIERARCHY).find(
    ([_, details]) => details.next === targetSignature
  )?.[0];

  return [
    targetSignature,
    ...getSignatureHierarchy(parent as BsdaSignatureType)
  ];
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
