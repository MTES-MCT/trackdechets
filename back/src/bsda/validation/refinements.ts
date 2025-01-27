import { Refinement, RefinementCtx, z } from "zod";
import { BsdaValidationContext } from "./types";
import {
  bsdaTransporterEditionRules,
  bsdaEditionRules,
  isBsdaFieldRequired,
  isBsdaTransporterFieldRequired,
  BsdaEditableFields,
  BsdaTransporterEditableFields,
  getSealedFields
} from "./rules";
import { getSignatureAncestors } from "./helpers";
import { capitalize } from "../../common/strings";
import { isArray } from "../../common/dataTypes";
import {
  Bsda,
  BsdaStatus,
  BsdaType,
  BsdType,
  Company,
  CompanyType
} from "@prisma/client";
import { PARTIAL_OPERATIONS } from "./constants";
import { getReadonlyBsdaRepository } from "../repository";
import { getOperationModesFromOperationCode } from "../../common/operationModes";
import { ParsedZodBsda } from "./schema";
import { prisma } from "@td/prisma";
import { isWorker } from "../../companies/validation";
import {
  isBrokerRefinement,
  isDestinationRefinement,
  isEcoOrganismeRefinement,
  isEmitterRefinement,
  isRegisteredVatNumberRefinement,
  isTransporterRefinement,
  refineSiretAndGetCompany
} from "../../common/validation/zod/refinement";
import { CompanyRole } from "../../common/validation/zod/schema";

export const checkOperationIsAfterReception: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  if (
    bsda.destinationReceptionDate &&
    bsda.destinationOperationDate &&
    bsda.destinationOperationDate < bsda.destinationReceptionDate
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `La date d'opération doit être postérieure à la date de réception`
    });
  }
};

export const checkOperationMode: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  const { destinationOperationCode, destinationOperationMode } = bsda;
  if (destinationOperationCode) {
    const modes = getOperationModesFromOperationCode(destinationOperationCode);

    if (
      (modes.length &&
        destinationOperationMode &&
        !modes.includes(destinationOperationMode)) ||
      (!modes.length && destinationOperationMode)
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie"
      });
    }
  }
};

export const checkNoEmitterWhenPrivateIndividual: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  if (bsda.emitterIsPrivateIndividual && bsda.emitterCompanySiret) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `L'émetteur est un particulier, impossible de saisir un SIRET émetteur`
    });
  }
};

export const checkNoWorkerWhenWorkerIsDisabled: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  if (
    bsda.workerIsDisabled &&
    (bsda.workerCompanyName || bsda.workerCompanySiret)
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Il n'y a pas d'entreprise de travaux, impossible de saisir le SIRET ou le nom de l'entreprise de travaux.`
    });
  }
};

export const checkWorkerSubSectionThree: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  if (
    !bsda.workerCertificationHasSubSectionThree &&
    (bsda.workerCertificationCertificationNumber ||
      bsda.workerCertificationValidityLimit ||
      bsda.workerCertificationOrganisation)
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Il n'y a pas de certification sous-section 3 amiante déclarée. Impossible de remplir les champs de la sous-section 3.`
    });
  }
};

export const checkNoTransporterWhenCollection2710: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  if (
    bsda.type === BsdaType.COLLECTION_2710 &&
    bsda.transporters &&
    bsda.transporters.length > 0
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Impossible de saisir un transporteur pour un bordereau de collecte en déchetterie.`
    });
  }
};

export const checkNoWorkerWhenCollection2710: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  if (
    bsda.type === BsdaType.COLLECTION_2710 &&
    (bsda.workerCompanyName != null || bsda.workerCompanySiret != null)
  ) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Impossible de saisir une entreprise de travaux pour un bordereau de collecte en déchetterie.`
    });
  }
};

export const checkNoBothGroupingAndForwarding: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  const isForwarding = Boolean(bsda.forwarding);
  const isGrouping = Boolean(bsda.grouping?.length);

  if ([isForwarding, isGrouping].filter(b => b).length > 1) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Les opérations d'entreposage provisoire et groupement ne sont pas compatibles entre elles"
    });
  }
};

export const checkRequiredFields: (
  validationContext: BsdaValidationContext
) => Refinement<ParsedZodBsda> = validationContext => {
  // Some signatures may be skipped, so always check all the hierarchy
  const signaturesToCheck = getSignatureAncestors(
    validationContext.currentSignatureType
  );

  return (bsda, { addIssue }) => {
    for (const bsdaField of Object.keys(bsdaEditionRules)) {
      const { required, readableFieldName } =
        bsdaEditionRules[bsdaField as keyof BsdaEditableFields];

      if (required) {
        const isRequired = isBsdaFieldRequired(
          required,
          bsda,
          signaturesToCheck
        );
        if (isRequired) {
          if (
            bsda[bsdaField] == null ||
            (isArray(bsda[bsdaField]) &&
              (bsda[bsdaField] as any[]).length === 0)
          ) {
            const fieldDescription = readableFieldName
              ? capitalize(readableFieldName)
              : `Le champ ${bsdaField}`;

            addIssue({
              code: z.ZodIssueCode.custom,
              path: [bsdaField],
              message: [
                `${fieldDescription} est obligatoire.`,
                required.customErrorMessage
              ]
                .filter(Boolean)
                .join(" ")
            });
          }
        }
      }
    }

    let checkableTransporters = bsda.transporters ?? [];

    if (validationContext.currentSignatureType === "OPERATION") {
      // Cas spécial permettant à l'installation de destination de valider l'opération
      // même si tous les transporteurs multi-modaux n'ont pas signé.
      checkableTransporters = checkableTransporters.filter(t =>
        Boolean(t.transporterTransportSignatureDate)
      );
    }

    checkableTransporters.forEach((transporter, idx) => {
      for (const bsdaTransporterField of Object.keys(
        bsdaTransporterEditionRules
      )) {
        const { required, readableFieldName } =
          bsdaTransporterEditionRules[
            bsdaTransporterField as keyof BsdaTransporterEditableFields
          ];

        if (required) {
          const isRequired = isBsdaTransporterFieldRequired(
            required,
            { ...transporter, number: idx + 1 },
            signaturesToCheck
          );
          if (isRequired) {
            if (
              transporter[bsdaTransporterField] == null ||
              (isArray(transporter[bsdaTransporterField]) &&
                (transporter[bsdaTransporterField] as any[]).length === 0)
            ) {
              const fieldDescription = readableFieldName
                ? capitalize(readableFieldName)
                : `Le champ ${bsdaTransporterField}`;

              addIssue({
                code: z.ZodIssueCode.custom,
                path: [`transporters[${idx}]${bsdaTransporterField}`],
                message: [
                  `${fieldDescription} n° ${idx + 1} est obligatoire.`,
                  required.customErrorMessage
                ]
                  .filter(Boolean)
                  .join(" ")
              });
            }
          }
        }
      }
    });
  };
};

async function checkEmitterIsNotEcoOrganisme(
  siret: string | null | undefined,
  ctx: RefinementCtx
) {
  if (!siret) return null;

  const ecoOrganisme = await prisma.ecoOrganisme.findFirst({
    where: { siret },
    select: { id: true }
  });

  if (ecoOrganisme) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `"L'émetteur ne peut pas être un éco-organisme. Merci de bien vouloir renseigner l'émetteur effectif de ce déchet (ex: déchetterie, producteur, TTR...). Un autre champ dédié existe et doit être utilisé pour viser l'éco-organisme concerné : https://faq.trackdechets.fr/dechets-dangereux-classiques/les-eco-organismes-sur-trackdechets#ou-etre-vise-en-tant-queco-organisme",`
    });
  }
}

/**
 * Ce refinement permet de vérifier que les établissements présents sur le
 * BSDA sont bien inscrits sur Trackdéchets avec le bon profil
 */
export const checkCompanies = async (
  bsda,
  zodContext,
  bsdaValidationContext: BsdaValidationContext
) => {
  const sealedFields = await getSealedFields(bsda, bsdaValidationContext);

  const isBsdaDestinationExemptFromVerification = (
    destination: Company | null
  ) => {
    if (!destination) return false;

    return (
      bsda.type === BsdaType.COLLECTION_2710 &&
      destination.companyTypes.includes(CompanyType.WASTE_CENTER)
    );
  };

  await isEmitterRefinement(
    bsda.emitterCompanySiret,
    BsdType.BSDA,
    zodContext,
    false,
    !sealedFields.includes("emitterCompanySiret")
  );
  await isDestinationRefinement(
    bsda.destinationCompanySiret,
    zodContext,
    "DESTINATION",
    CompanyRole.Destination,
    isBsdaDestinationExemptFromVerification,
    !sealedFields.includes("destinationCompanySiret")
  );
  await isDestinationRefinement(
    bsda.destinationOperationNextDestinationCompanySiret,
    zodContext,
    "DESTINATION",
    CompanyRole.DestinationOperationNextDestination,
    isBsdaDestinationExemptFromVerification,
    !sealedFields.includes("destinationOperationNextDestinationCompanySiret")
  );
  for (const transporter of bsda.transporters ?? []) {
    await isTransporterRefinement(
      {
        siret: transporter.transporterCompanySiret,
        transporterRecepisseIsExempted:
          transporter.transporterRecepisseIsExempted ?? false
      },
      zodContext,
      !sealedFields.includes("transporters")
    );
    await isRegisteredVatNumberRefinement(
      transporter.transporterCompanyVatNumber,
      zodContext
    );
  }
  await isWorkerRefinement(
    bsda.workerCompanySiret,
    zodContext,
    !sealedFields.includes("workerCompanySiret")
  );
  await isEcoOrganismeRefinement(
    bsda.ecoOrganismeSiret,
    BsdType.BSDA,
    zodContext,
    !sealedFields.includes("ecoOrganismeSiret")
  );
  await checkEmitterIsNotEcoOrganisme(bsda.emitterCompanySiret, zodContext);

  await isBrokerRefinement(
    bsda.brokerCompanySiret,
    zodContext,
    !sealedFields.includes("brokerCompanySiret")
  );

  if (bsda.intermediaries) {
    for (const intermediary of bsda.intermediaries) {
      await refineSiretAndGetCompany(
        intermediary.siret,
        zodContext,
        CompanyRole.Intermediary,
        !sealedFields.includes("intermediaries")
      );
    }
  }
};

export const validatePreviousBsdas: Refinement<ParsedZodBsda> = async (
  bsda,
  { addIssue }
) => {
  if (!["GATHERING", "RESHIPMENT"].includes(bsda.type as string)) {
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
    addIssue({
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
    addIssue({
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
    addIssue({
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
    addIssue({
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
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Tous les bordereaux groupés doivent avoir le même code déchet que le bordereau de groupement.`,
      fatal: true
    });
    return z.NEVER;
  }

  for (const previousBsda of previousBsdas) {
    if (previousBsda.status === BsdaStatus.PROCESSED) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le bordereau n°${previousBsda.id} a déjà reçu son traitement final.`,
        fatal: true
      });
      continue;
    }

    if (previousBsda.status !== BsdaStatus.AWAITING_CHILD) {
      addIssue({
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
      !nextBsdas.map(bsda => bsda.id).includes(bsda.id!)
    ) {
      addIssue({
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
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le bordereau n°${previousBsda.id} a déclaré un traitement qui ne permet pas de lui donner la suite voulue.`,
        fatal: true
      });
    }
  }
};

/**
 * Destination is editable until TRANSPORT.
 * But afer EMISSION, if you change the destination, the current destination must become the nextDestination.
 */
export const validateDestination: (
  validationContext: BsdaValidationContext
) => Refinement<ParsedZodBsda> = validationContext => {
  const currentSignatureType = validationContext.currentSignatureType;
  return async (bsda, { addIssue }) => {
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
      addIssue({
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
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Impossible de retirer un intermédiaire d'entreposage provisoire sans indiquer la destination finale prévue initialement comme destination.`,
        fatal: true
      });
    }
  };
};

export const checkTransporters: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  if (bsda.id) {
    const alreadyPartOfAnotherBsda = bsda.transporters?.find(
      t => Boolean(t.bsdaId) && t.bsdaId !== bsda.id
    );
    if (alreadyPartOfAnotherBsda) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le transporteur BSDA ${alreadyPartOfAnotherBsda.id} est déjà associé à un autre BSDA`
      });
    }
  }
};
export async function isWorkerRefinement(
  siret: string | null | undefined,
  ctx,
  checkIsNotDormant = true
) {
  const company = await refineSiretAndGetCompany(
    siret,
    ctx,
    CompanyRole.Worker,
    checkIsNotDormant
  );

  if (company && !isWorker(company)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        `L'entreprise de travaux saisie sur le bordereau (SIRET: ${siret}) n'est pas inscrite sur Trackdéchets` +
        ` en tant qu'entreprise de travaux. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
        ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
        ` de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
    });
  }
}

export const validateDestinationReceptionWeight: (
  validationContext: BsdaValidationContext
) => Refinement<ParsedZodBsda> = validationContext => {
  const currentSignatureType = validationContext.currentSignatureType;
  return async (bsda, { addIssue }) => {
    // Destination is freely editable until EMISSION signature.
    // Once transported, destination is not editable for anyone.
    // This is enforced by the sealing rules
    if (currentSignatureType !== "OPERATION") {
      return;
    }

    if (
      !bsda.destinationReceptionWeight &&
      ["ACCEPTED", "PARTIALLY_REFUSED"].includes(
        bsda.destinationReceptionAcceptationStatus ?? ""
      )
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le poids du déchet reçu doit être renseigné et non nul.`,
        fatal: true
      });
    }
  };
};
