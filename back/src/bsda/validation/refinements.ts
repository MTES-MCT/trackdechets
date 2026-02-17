import { Refinement, RefinementCtx, z } from "zod";
import { BsdaValidationContext } from "./types";
import {
  bsdaTransporterEditionRules,
  bsdaEditionRules,
  isBsdaFieldRequired,
  isBsdaTransporterFieldRequired,
  BsdaEditableFields,
  BsdaTransporterEditableFields,
  getSealedFields,
  EditionRulePath
} from "./rules";
import { getSignatureAncestors } from "./helpers";
import { Decimal } from "decimal.js";
import { capitalize } from "../../common/strings";
import { isArray } from "../../common/dataTypes";
import {
  Bsda,
  BsdaStatus,
  BsdaType,
  BsdType,
  Company,
  CompanyType,
  WasteAcceptationStatus
} from "@td/prisma";
import { PARTIAL_OPERATIONS } from "./constants";
import { getReadonlyBsdaRepository } from "../repository";
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
import { isDefined } from "../../common/helpers";
import { isBSDAFinalOperationCode } from "../../common/operationCodes";
import { getOperationModes } from "@td/constants";

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
      path: ["destination", "operation", "date"] as EditionRulePath,
      message: `La date d'opération doit être postérieure à la date de réception`
    });
  }
};

export const checkOperationMode: Refinement<ParsedZodBsda> = (
  bsda,
  { addIssue }
) => {
  const {
    destinationOperationCode,
    destinationOperationMode,
    destinationOperationSignatureDate
  } = bsda;

  // Le BSDA a déjà été signé. On ne vérifie plus le mode pour ne pas casser les BSDs legacy
  if (destinationOperationSignatureDate && destinationOperationCode) {
    return;
  }

  if (destinationOperationCode) {
    const modes = getOperationModes(destinationOperationCode);

    if (
      (modes.length &&
        destinationOperationMode &&
        !modes.includes(destinationOperationMode)) ||
      (!modes.length && destinationOperationMode)
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination", "operation", "mode"] as EditionRulePath,
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
      path: ["emitter", "company", "siret"] as EditionRulePath,
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
      path: ["worker", "company", "siret"] as EditionRulePath,
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
      path: [
        "worker",
        "certification",
        "certificationNumber"
      ] as EditionRulePath,
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
      path: ["transporters"] as EditionRulePath,
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
      path: ["worker", "company", "siret"] as EditionRulePath,
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
      path: ["forwarding"] as EditionRulePath,
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
      const { required, readableFieldName, path } =
        bsdaEditionRules[bsdaField as keyof BsdaEditableFields];

      if (required) {
        const isRequired = isBsdaFieldRequired(
          required,
          bsda,
          signaturesToCheck,
          validationContext.currentSignatureType
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
              path: path ?? [bsdaField],
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

    (bsda.transporters ?? []).forEach((transporter, idx) => {
      if (
        ["OPERATION", "RECEPTION"].includes(
          validationContext.currentSignatureType ?? ""
        ) &&
        !transporter.transporterTransportSignatureDate
      ) {
        return;
      }
      for (const bsdaTransporterField of Object.keys(
        bsdaTransporterEditionRules
      )) {
        const {
          required,
          readableFieldName,
          path: bsdaTransporterPath
        } = bsdaTransporterEditionRules[
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
              const path = ["transporters", `${idx + 1}`].concat(
                bsdaTransporterPath ?? []
              ) as EditionRulePath;
              addIssue({
                code: z.ZodIssueCode.custom,
                path: path ?? [`transporters[${idx}]${bsdaTransporterField}`],
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
    where: { siret, handleBsda: true },
    select: { id: true }
  });

  if (ecoOrganisme) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["emitter", "company", "siret"] as EditionRulePath,
      message: `L'émetteur ne peut pas être un éco-organisme. Merci de bien vouloir renseigner l'émetteur effectif de ce déchet (ex: déchetterie, producteur, TTR...).`
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
      // Transporters are sealed when all transporters have signed
      // If one of the transporter has already signed, we should not block if he is sleeping
      transporter.transporterTransportSignatureDate == null ||
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
      path: ["forwarding"] as EditionRulePath,
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
      path: ["forwarding"] as EditionRulePath,
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
      path: ["forwarding"] as EditionRulePath,
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
      path: ["forwarding"] as EditionRulePath,
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
      path: ["grouping"] as EditionRulePath,
      message: `Tous les bordereaux groupés doivent avoir le même code déchet que le bordereau de groupement.`,
      fatal: true
    });
    return z.NEVER;
  }

  for (const previousBsda of previousBsdas) {
    if (previousBsda.status === BsdaStatus.PROCESSED) {
      addIssue({
        code: z.ZodIssueCode.custom,
        path: ["forwarding"] as EditionRulePath,
        message: `Le bordereau n°${previousBsda.id} a déjà reçu son traitement final.`,
        fatal: true
      });
      continue;
    }

    if (previousBsda.status !== BsdaStatus.AWAITING_CHILD) {
      addIssue({
        code: z.ZodIssueCode.custom,
        path: ["forwarding"] as EditionRulePath,
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
        path: ["forwarding"] as EditionRulePath,
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
        path: ["forwarding"] as EditionRulePath,
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
      !currentBsda.destinationOperationNextDestinationCompanySiret &&
      bsda.destinationOperationNextDestinationCompanySiret !==
        currentBsda.destinationCompanySiret
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        path: [
          "destination",
          "operation",
          "nextDestination",
          "company",
          "siret"
        ] as EditionRulePath,
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
        path: [
          "destination",
          "operation",
          "nextDestination",
          "company",
          "siret"
        ] as EditionRulePath,
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
    const alreadyPartOfAnotherBsdaIndex = bsda.transporters?.findIndex(
      t => Boolean(t.bsdaId) && t.bsdaId !== bsda.id
    );
    if (
      alreadyPartOfAnotherBsdaIndex !== undefined &&
      alreadyPartOfAnotherBsdaIndex !== -1
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        path: [
          "transporters",
          `${alreadyPartOfAnotherBsdaIndex + 1}`,
          "company",
          "siret"
        ] as any as EditionRulePath,
        message: `Le transporteur BSDA ${bsda.transporters?.[alreadyPartOfAnotherBsdaIndex]?.id} est déjà associé à un autre BSDA`
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
      path: ["worker", "company", "siret"] as EditionRulePath,
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
    if (
      currentSignatureType !== "RECEPTION" &&
      currentSignatureType !== "OPERATION"
    ) {
      return;
    }

    const isAcceptedButNoWeight =
      !bsda.destinationReceptionWeight &&
      ["ACCEPTED", "PARTIALLY_REFUSED"].includes(
        bsda.destinationReceptionAcceptationStatus ?? ""
      );
    const isRefusedButZeroWeight =
      bsda.destinationReceptionWeight === 0 &&
      bsda.destinationReceptionAcceptationStatus === "REFUSED";

    if (isAcceptedButNoWeight || isRefusedButZeroWeight) {
      addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination", "reception", "weight"] as EditionRulePath,
        message: `Le poids du déchet reçu doit être renseigné et non nul.`,
        fatal: true
      });
    }

    const packagingTypes = bsda.packagings?.map(p => p.type);
    if (
      bsda.destinationReceptionWeightIsEstimate &&
      packagingTypes.every(t => t !== "CONTENEUR_BAG")
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le poids du déchet reçu ne peut pas être estimé si au moins un des contenants n'est pas un conteneur-bag.`,
        fatal: true
      });
    }
  };
};

export const wasteAdrRefinement: (
  validationContext: BsdaValidationContext
) => Refinement<ParsedZodBsda> = validationContext => {
  const currentSignatureType = validationContext.currentSignatureType;
  return (bsda, zodContext) => {
    // Draft
    if (!currentSignatureType) return;

    const { addIssue } = zodContext;
    const { wasteAdr, wasteIsSubjectToADR } = bsda;

    // New method: using the switch wasteIsSubjectToADR
    if (isDefined(wasteIsSubjectToADR)) {
      if (wasteIsSubjectToADR === true && !isDefined(wasteAdr)) {
        addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waste", "adr"] as EditionRulePath,
          message: `Le déchet est soumis à l'ADR. Vous devez préciser la mention correspondante.`,
          fatal: true
        });
        return;
      } else if (wasteIsSubjectToADR === false && isDefined(wasteAdr)) {
        addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waste", "adr"] as EditionRulePath,
          message: `Le déchet n'est pas soumis à l'ADR. Vous ne pouvez pas préciser de mention ADR.`,
          fatal: true
        });
        return;
      }
    }
  };
};

export const checkBsdaDestinationReceptionRefusedWeight = (
  bsd,
  ctx: z.RefinementCtx
) => {
  const path = ["destination", "reception", "refusedWeight"] as EditionRulePath;

  const {
    destinationReceptionWeight,
    destinationReceptionRefusedWeight,
    destinationReceptionAcceptationStatus
  } = bsd;

  if (!isDefined(destinationReceptionRefusedWeight)) {
    // If status is defined, it means that the reception happened. Refused weight is required
    if (isDefined(destinationReceptionAcceptationStatus)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La quantité refusée (destinationReceptionRefusedWeight) est requise",
        path
      });
      return;
    }

    return;
  }

  if (!isDefined(destinationReceptionWeight)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La quantité refusée (destinationReceptionRefusedWeight) ne peut être définie si la quantité reçue (destinationReceptionWeight) ne l'est pas",
      path
    });
    return;
  }

  // Weights can come from the frontend (numbers) or the DB (Decimals). Harmonize
  const receptionWeight = new Decimal(destinationReceptionWeight);
  const refusedWeight = new Decimal(destinationReceptionRefusedWeight);

  if (
    !refusedWeight.equals(0) &&
    destinationReceptionAcceptationStatus == WasteAcceptationStatus.ACCEPTED
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La quantité refusée (destinationReceptionRefusedWeight) ne peut être supérieure à zéro si le déchet est accepté (ACCEPTED)",
      path
    });
    return;
  }

  if (
    destinationReceptionAcceptationStatus == WasteAcceptationStatus.REFUSED &&
    !refusedWeight?.equals(receptionWeight)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La quantité refusée (destinationReceptionRefusedWeight) doit être égale à la quantité reçue (destinationReceptionWeight) si le déchet est refusé (REFUSED)",
      path
    });
    return;
  }

  if (
    destinationReceptionAcceptationStatus ==
    WasteAcceptationStatus.PARTIALLY_REFUSED
  ) {
    if (
      refusedWeight.greaterThanOrEqualTo(receptionWeight) ||
      refusedWeight.equals(0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La quantité refusée (destinationReceptionRefusedWeight) doit être inférieure à la quantité reçue (destinationReceptionWeight) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)",
        path
      });
      return;
    }
  }

  if (refusedWeight.greaterThan(receptionWeight)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "La quantité refusée (destinationReceptionRefusedWeight) doit être inférieure ou égale à la quantité réceptionnée (destinationReceptionWeight)",
      path
    });
    return;
  }
};

export const validateReceptionOperationCode: (
  validationContext: BsdaValidationContext
) => Refinement<ParsedZodBsda> = validationContext => {
  const currentSignatureType = validationContext.currentSignatureType;

  return async (bsda, { addIssue }) => {
    if (currentSignatureType !== "OPERATION") {
      return;
    }

    const {
      destinationOperationCode,
      destinationOperationNextDestinationCompanySiret
    } = bsda;

    const isTempStorageReception =
      !bsda.forwarding &&
      !bsda.grouping?.length &&
      isDefined(destinationOperationNextDestinationCompanySiret);

    // Attention! Lors d'une réception sur une étape d'entreposage provisoire,
    // on ne doit pas pouvoir renseigner un code de traitement final!
    if (
      isBSDAFinalOperationCode(destinationOperationCode ?? null) &&
      isTempStorageReception
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vous ne pouvez pas renseigner un code de traitement final",
        path: ["destination", "operation", "code"] as EditionRulePath
      });
    }

    const estimateReceptionPossibleCodes = ["R 13", "D 15"];
    if (
      bsda.destinationReceptionWeightIsEstimate &&
      destinationOperationCode &&
      !estimateReceptionPossibleCodes.includes(destinationOperationCode)
    ) {
      addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le poids de reception est indiqué comme estimé. La destination est obligatoirement un TTR et le code d'opération doit être R13 ou D15",
        path: ["destination", "operation", "code"]
      });
    }

    return;
  };
};
