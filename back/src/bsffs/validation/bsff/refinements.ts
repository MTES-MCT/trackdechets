import { Refinement, RefinementCtx, z } from "zod";
import { BsffValidationContext } from "./types";
import {
  ParsedZodBsff,
  ZodBsff,
  ZodBsffPackaging,
  ZodBsffTransporter
} from "./schema";
import {
  BsffEditableFields,
  BsffPackagingEditableFields,
  BsffTransporterEditableFields,
  EditionRule,
  EditionRulePath,
  bsffEditionRules,
  bsffPackagingEditionRules,
  bsffTransporterEditionRules,
  isBsffFieldRequired,
  isBsffPackagingFieldRequired,
  isBsffTransporterFieldRequired
} from "./rules";
import { getSignatureAncestors } from "./helpers";
import { isArray } from "../../../common/dataTypes";
import { capitalize } from "../../../common/strings";
import {
  BsdType,
  BsffPackagingType,
  BsffType,
  Prisma,
  TransportMode
} from "@td/prisma";
import { prisma } from "@td/prisma";
import { OPERATION } from "../../constants";
import type { BsffOperationCode } from "@td/codegen-back";
import {
  isDestinationRefinement,
  isEmitterRefinement,
  isRegisteredVatNumberRefinement,
  isTransporterRefinement
} from "../../../common/validation/zod/refinement";
import { MAX_WEIGHT_BY_ROAD_TONNES } from "../../../common/validation";

// Date de la MAJ 2024.07.1 introduisant un changement
// des règles de validations sur les poids et volume qui doivent
// désormais être strictement > 0
const v2024071 = new Date("2024-07-03");

// Date de la MAJ 2024.9.1 qui rend obligatoire
// le volume sur les contenants
const v2024091 = new Date("2024-09-24");

/**
 * Ce refinement permet de vérifier que les établissements présents sur le
 * BSFF sont bien inscrits sur Trackdéchets avec le bon profil
 */
export const checkCompanies: Refinement<ParsedZodBsff> = async (
  bsff,
  zodContext
) => {
  await isEmitterRefinement(bsff.emitterCompanySiret, BsdType.BSFF, zodContext);
  await isDestinationRefinement(bsff.destinationCompanySiret, zodContext);

  for (const transporter of bsff.transporters ?? []) {
    await isTransporterRefinement(
      {
        siret: transporter.transporterCompanySiret,
        transporterRecepisseIsExempted:
          transporter.transporterRecepisseIsExempted ?? false
      },
      zodContext
    );
    await isRegisteredVatNumberRefinement(
      transporter.transporterCompanyVatNumber,
      zodContext
    );
  }
};

export const checkPackagings: Refinement<ParsedZodBsff> = (
  bsff,
  { addIssue }
) => {
  for (const packaging of bsff.packagings ?? []) {
    const isCreatedAfterV2024071 =
      bsff.createdAt && bsff.createdAt.getTime() - v2024071.getTime() > 0;

    const isCreatedAfterV2024091 =
      bsff.createdAt && bsff.createdAt.getTime() - v2024091.getTime() > 0;

    if (
      (packaging.volume === null || packaging.volume === undefined) &&
      !bsff.isDraft &&
      ![BsffType.REEXPEDITION, BsffType.GROUPEMENT].includes(bsff.type) &&
      isCreatedAfterV2024091
    ) {
      // TRA-14567 Le volume est rendu obligatoire sur les contenants BSFF
      // à partir de la v2024091. L'obligation ne concerne pas les bordereaux
      // de groupement ou réexpedition pour ne pas bloquer des utilisateurs
      // regroupant des BSFF crées avant 2024091 ayant un volume null (les contenants
      // étant calculés automatiquement à partir des contenants réexpédiés / regroupés).
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "Conditionnements : le volume est requis"
      });
    }

    if (packaging.volume === 0 && isCreatedAfterV2024071) {
      // Changement de règle de validation dans la MAJ 2024.07.1. Il était possible
      // avant de passer un volume égal à 0. On restreint désormais aux valeurs strictement
      // positives mais uniquement pour les nouveaux bordereaux crées afin d'éviter des
      // erreurs de validation sur des BSFFs qui ont déjà été publiés en l'état.
      // On pourra à terme passer de .nonnegative à .positive directement dans le schéma zod.
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "Conditionnements : le volume doit être supérieur à 0"
      });
    }

    if (packaging.weight === 0 && isCreatedAfterV2024071) {
      // Changement de règle de validation dans la MAJ 2024.07.1. Il était possible
      // avant de passer un poids égal à 0. On restreint désormais aux valeurs strictement
      // positives mais uniquement pour les nouveaux bordereaux crées afin d'éviter des
      // erreurs de validation sur des BSFFs qui ont déjà été publiés en l'état.
      // On pourra à terme passer de .nonnegative à .positive directement dans le schéma zod.
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "Conditionnements : le poids doit être supérieur à 0"
      });
    }

    if (
      packaging.type === BsffPackagingType.AUTRE &&
      (!packaging.other || packaging.other === "")
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Conditionnement : le champ `other` doit être précisée pour le conditionnement 'AUTRE'."
      });
    }

    if (
      packaging.type !== BsffPackagingType.AUTRE &&
      packaging.other &&
      packaging.other.length > 0
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Conditionnement : le champ `other` ne peut être renseigné que lorsque le type de conditionnement est 'AUTRE'."
      });
    }
  }
};

export const checkFicheInterventions: Refinement<ParsedZodBsff> = async (
  bsff,
  { addIssue }
) => {
  if (bsff.ficheInterventions && bsff.ficheInterventions.length > 0) {
    if (bsff.type !== BsffType.COLLECTE_PETITES_QUANTITES) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le type de BSFF choisi ne permet pas d'associer des fiches d'intervention.`
      });
    }
    const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
      where: { id: { in: bsff.ficheInterventions } }
    });
    for (const ficheIntervention of ficheInterventions) {
      if (
        bsff.emitterCompanySiret &&
        ficheIntervention.operateurCompanySiret &&
        bsff.emitterCompanySiret !== ficheIntervention.operateurCompanySiret
      ) {
        addIssue({
          code: z.ZodIssueCode.custom,
          message: `L'opérateur identifié sur la fiche d'intervention ${ficheIntervention.numero} ne correspond pas à l'émetteur de BSFF`
        });
      }
    }
  }
};

export const checkWeights: Refinement<ParsedZodBsff> = (bsff, { addIssue }) => {
  // Lors d'un transport par route, vérifie que le poids est cohérent avec
  // la charge maximale autorisé
  if (
    (bsff.transporters ?? []).some(
      t => t.transporterTransportMode === TransportMode.ROAD
    )
  ) {
    const weights = [
      bsff.weightValue,
      ...(bsff.packagings ?? []).map(p => p.weight)
    ].filter(Boolean);
    if (weights.some(w => w > MAX_WEIGHT_BY_ROAD_TONNES * 1000)) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `le poids doit être inférieur à ${MAX_WEIGHT_BY_ROAD_TONNES}` +
          ` tonnes lorsque le transport se fait par la route`
      });
    }
  }

  if (
    bsff.weightValue === 0 &&
    bsff.createdAt &&
    bsff.createdAt.getTime() - v2024071.getTime() > 0
  ) {
    // Changement de règle de validation dans la MAJ 2024.07.1. Il était possible
    // avant de passer un poids égal à 0. On restreint désormais aux valeurs strictement
    // positives mais uniquement pour les nouveaux bordereaux crées afin d'éviter des
    // erreurs de validation sur des BSFFs qui ont déjà été publiés en l'état.
    // On pourra à terme passer de .nonnegative à .positive directement dans le schéma zod.}
    addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le poids doit être supérieur à 0"
    });
  }
};

/**
 * Vérifie que le type du BSFF est compatible avec la valeur de `forwarding`, `grouping` et `repackaging`.
 */
function checkBsffTypeIsCompatible(
  bsff: ParsedZodBsff,
  ctx: RefinementCtx
): boolean {
  const { addIssue } = ctx;
  const { forwarding, grouping, repackaging } = bsff;

  const isForwarding = forwarding && forwarding.length > 0;
  const isRepackaging = repackaging && repackaging.length > 0;
  const isGrouping = grouping && grouping.length > 0;

  if (isForwarding && bsff.type !== BsffType.REEXPEDITION) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez sélectionner le type de BSFF `REEXPEDITION` avec le paramètre `forwarding`"
    });
    return false;
  }

  if (isRepackaging && bsff.type !== BsffType.RECONDITIONNEMENT) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez sélectionner le type de BSFF `RECONDITIONNEMENT` avec le paramètre `repackaging`"
    });
    return false;
  }

  if (isGrouping && bsff.type !== BsffType.GROUPEMENT) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez sélectionner le type de BSFF `GROUPEMENT` avec le paramètre `repackaging`"
    });
    return false;
  }
  return true;
}

/**
 * Vérifie que le SIRET de l'installation émettrice est renseigné en cas de groupement / reconditionnement / réexpedition
 */
function checkEmitterSiretIsDefined(
  bsff: ParsedZodBsff,
  ctx: RefinementCtx
): boolean {
  const { addIssue } = ctx;
  const { forwarding, grouping, repackaging } = bsff;

  const isForwarding = forwarding && forwarding.length > 0;
  const isRepackaging = repackaging && repackaging.length > 0;
  const isGrouping = grouping && grouping.length > 0;

  if (
    (isForwarding || isRepackaging || isGrouping) &&
    !bsff.emitterCompanySiret
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez renseigner le siret de l'installation émettrice du nouveau BSFF en cas de groupement, réexpédition ou reéxpédition"
    });
    return false;
  }
  return true;
}

const PreviousPackagingInclude = {
  bsff: true,
  nextPackaging: { select: { bsffId: true } }
} satisfies Prisma.BsffPackagingInclude;

export type PreviousPackaging = Prisma.BsffPackagingGetPayload<{
  include: typeof PreviousPackagingInclude;
}>;

function getAction(bsff: ParsedZodBsff) {
  switch (bsff.type) {
    case BsffType.REEXPEDITION:
      return "réexpédier";
    case BsffType.GROUPEMENT:
      return "grouper";
    case BsffType.RECONDITIONNEMENT:
      return "reconditionner";
    default:
      return "";
  }
}

async function checkPreviousPackagingsExists(
  bsff: ParsedZodBsff,
  ctx: RefinementCtx
): Promise<PreviousPackaging[]> {
  const { addIssue } = ctx;
  const previousPackagingIds = [
    ...(bsff.grouping ?? []),
    ...(bsff.forwarding ?? []),
    ...(bsff.repackaging ?? [])
  ];

  const previousPackagings = await prisma.bsffPackaging.findMany({
    where: { id: { in: previousPackagingIds } },
    include: PreviousPackagingInclude
  });

  if (previousPackagings.length < previousPackagingIds.length) {
    const notFoundIds = previousPackagingIds.filter(
      id => !previousPackagings.map(p => p.id).includes(id)
    );
    const action = getAction(bsff);
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Les identifiants de contenants de fluide à ${action} ${notFoundIds.join(
        ", "
      )} n'existent pas`
    });
    return [];
  }
  return previousPackagings;
}

function checkForwardingAreOnSameBsff(
  forwarding: PreviousPackaging[],
  ctx: RefinementCtx
): boolean {
  const { addIssue } = ctx;
  const bsffIds = forwarding.map(p => p.bsffId);
  const isOnSameBsff = bsffIds.every(id => id === bsffIds[0]);
  if (!isOnSameBsff) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Tous les contenants réexpédiés doivent apparaitre sur le même BSFF initial"
    });
    return false;
  }
  return true;
}

function checkSameWasteCodes(
  bsff: ParsedZodBsff,
  previousPackagings: PreviousPackaging[],
  ctx: RefinementCtx
): boolean {
  const { addIssue } = ctx;

  const wasteCodes = previousPackagings.map(
    p => p.acceptationWasteCode ?? p.bsff?.wasteCode ?? ""
  );

  const wasteCodesUnique = [...new Set(wasteCodes)].filter(
    code => code !== null && code.length > 0
  );

  const wasteCodesUniqueSorted = [...wasteCodesUnique].sort((c1, c2) =>
    c1.localeCompare(c2)
  );

  const action = getAction(bsff);
  if (wasteCodesUniqueSorted?.length > 1) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Vous ne pouvez pas ${action} des contenants ayant des codes déchet différents : ${wasteCodesUniqueSorted.join(
        ", "
      )}`
    });
    return false;
  }
  return true;
}

/**
 * Vérifie pour chaque contenant réexpédié, groupé ou reconditionné que :
 *  - il a bien été traité avec un code de traitement compatible
 *  - il a bien pour destination le SIRET de l'installation émettrice du BSFF de groupement / reconditionnement / reéxpédition
 *  - il n'a pas été inclus dans un autre BSFF de groupement / reconditionnement / reéxpédition
 */
function checkPreviousPackaging(
  bsff: ParsedZodBsff,
  packaging: PreviousPackaging,
  ctx: RefinementCtx
) {
  const { addIssue } = ctx;

  if (packaging.bsff.destinationCompanySiret !== bsff.emitterCompanySiret) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `Le BSFF ${packaging.bsffId} sur lequel apparait le contenant ${packaging.id} (${packaging.numero}) ` +
        `n'a pas été traité sur l'installation émettrice du nouveau BSFF ${bsff.emitterCompanySiret}`
    });
  }

  if (!packaging.operationSignatureDate) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La signature de l'opération n'a pas encore été faite sur le contenant ${packaging.id} - ${packaging.numero}`
    });
  } else {
    const operation = OPERATION[packaging.operationCode as BsffOperationCode];

    if (!bsff.type || !operation.successors.includes(bsff.type)) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          `Une opération de traitement finale a été déclarée sur le contenant n°${packaging.id} (${packaging.numero}). ` +
          `Vous ne pouvez pas l'ajouter sur un BSFF de groupement, reconditionnement ou réexpédition`
      });
    }
  }

  if (
    !!packaging.nextPackagingId &&
    packaging.nextPackaging!.bsffId !== bsff.id
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le contenant n°${packaging.id} (${packaging.numero}) a déjà été réexpédié, reconditionné ou groupé dans un autre BSFF.`
    });
  }
}

/**
 * Les vérifications suivantes sont effectuées :
 * - Vérifie que le SIRET de l'installation émettrice est renseigné
 * - Vérifie que l'utilisateur n'essaye pas de rensigner des informations sur les contenants en cas de groupement
 * ou reéxpédition (c'est calculé automatiquement à partir des infos des contenants initiaux).
 * - Vérifie qu'un seul contenant est spécifié en cas de reconditionnement
 * - Vérifie que les identifiants de contenants existent

 */
export const checkPreviousPackagings: (
  bsff: ParsedZodBsff,
  ctx: RefinementCtx
) => Promise<PreviousPackaging[]> = async (bsff, ctx) => {
  const { addIssue } = ctx;

  const { forwarding, grouping, repackaging } = bsff;

  const previousPackagingIds = [
    ...(forwarding ?? []),
    ...(grouping ?? []),
    ...(repackaging ?? [])
  ];

  if (
    previousPackagingIds.length === 0 &&
    [
      BsffType.GROUPEMENT,
      BsffType.REEXPEDITION,
      BsffType.RECONDITIONNEMENT
    ].includes(bsff.type as any)
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Vous devez saisir des contenants en transit en cas de groupement, reconditionnement ou réexpédition"
    });
    return [];
  }

  let checked: boolean;

  checked = checkBsffTypeIsCompatible(bsff, ctx);
  if (!checked) {
    return [];
  }

  checked = checkEmitterSiretIsDefined(bsff, ctx);
  if (!checked) {
    return [];
  }

  const previousPackagings = await checkPreviousPackagingsExists(bsff, ctx);
  if (previousPackagings.length === 0) {
    return [];
  }

  if (bsff.type === BsffType.REEXPEDITION) {
    checked = checkForwardingAreOnSameBsff(previousPackagings, ctx);
    if (!checked) {
      return [];
    }
  }

  if (
    bsff.type === BsffType.REEXPEDITION ||
    bsff.type === BsffType.GROUPEMENT
  ) {
    checked = checkSameWasteCodes(bsff, previousPackagings, ctx);
    if (!checked) {
      return [];
    }
  }

  previousPackagings.forEach(packaging => {
    checkPreviousPackaging(bsff, packaging, ctx);
  });

  return previousPackagings;
};

type CheckFieldIsDefinedArgs<
  T extends ZodBsff | ZodBsffTransporter | ZodBsffPackaging
> = {
  resource: T;
  field: string;
  rule: EditionRule<T>;
  readableFieldName?: string;
  path?: EditionRulePath;
  ctx: RefinementCtx;
  errorMsg?: (fieldDescription: string) => string;
};

function checkFieldIsDefined<
  T extends ZodBsff | ZodBsffTransporter | ZodBsffPackaging
>(args: CheckFieldIsDefinedArgs<T>) {
  const { resource, field, rule, ctx, readableFieldName, path, errorMsg } =
    args;
  const value = resource[field];
  if (value == null || (isArray(value) && (value as any[]).length === 0)) {
    const fieldDescription = readableFieldName
      ? capitalize(readableFieldName)
      : `Le champ ${field}`;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: path ?? [field],
      message: [
        errorMsg
          ? errorMsg(fieldDescription)
          : `${fieldDescription} est un champ requis.`,
        rule.customErrorMessage
      ]
        .filter(Boolean)
        .join(" ")
    });
  }
}

export const checkRequiredFields: (
  validationContext: BsffValidationContext
) => Refinement<ParsedZodBsff> = validationContext => {
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );

  return (bsff, zodContext) => {
    for (const bsffField of Object.keys(bsffEditionRules)) {
      const { required, readableFieldName, path } =
        bsffEditionRules[bsffField as keyof BsffEditableFields];

      if (required) {
        const isRequired = isBsffFieldRequired(
          required,
          bsff,
          signaturesToCheck
        );
        if (isRequired) {
          checkFieldIsDefined({
            resource: bsff,
            field: bsffField,
            rule: required,
            path,
            readableFieldName,
            ctx: zodContext
          });
        }
      }
    }

    (bsff.transporters ?? []).forEach((transporter, idx) => {
      for (const bsffTransporterField of Object.keys(
        bsffTransporterEditionRules
      )) {
        const {
          required,
          readableFieldName,
          path: bsffTransporterPath
        } = bsffTransporterEditionRules[
          bsffTransporterField as keyof BsffTransporterEditableFields
        ];

        if (required) {
          const isRequired = isBsffTransporterFieldRequired(
            required,
            { ...transporter, number: idx + 1 },
            signaturesToCheck
          );
          if (isRequired) {
            checkFieldIsDefined({
              resource: transporter,
              field: bsffTransporterField,
              rule: required,
              readableFieldName,
              path: ["transporters", `${idx + 1}`].concat(
                bsffTransporterPath ?? []
              ) as EditionRulePath,
              ctx: zodContext,
              errorMsg: fieldDescription =>
                `${fieldDescription} n° ${idx + 1} est obligatoire.`
            });
          }
        }
      }
    });

    (bsff.packagings ?? []).forEach((packaging, idx) => {
      for (const bsffPackaginField of Object.keys(bsffPackagingEditionRules)) {
        const {
          required,
          readableFieldName,
          path: bsffPackagingPath
        } = bsffPackagingEditionRules[
          bsffPackaginField as keyof BsffPackagingEditableFields
        ];
        if (required) {
          const isRequired = isBsffPackagingFieldRequired(
            required,
            packaging,
            signaturesToCheck
          );
          if (isRequired) {
            checkFieldIsDefined({
              resource: packaging,
              field: bsffPackaginField,
              rule: required,
              readableFieldName,
              path: ["packagings", `${idx + 1}`].concat(
                bsffPackagingPath ?? []
              ) as EditionRulePath,
              ctx: zodContext
            });
          }
        }
      }
    });
  };
};
