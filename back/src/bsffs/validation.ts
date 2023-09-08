import * as yup from "yup";
import {
  Bsff,
  BsffPackaging as PrismaBsffPackaging,
  TransportMode,
  BsffFicheIntervention,
  BsffType,
  Prisma,
  WasteAcceptationStatus,
  BsffPackagingType,
  OperationMode
} from "@prisma/client";
import { BsffOperationCode, BsffPackaging } from "../generated/graphql/types";
import { isFinalOperation, OPERATION } from "./constants";
import prisma from "../prisma";
import configureYup, { FactorySchemaOf } from "../common/yup/configureYup";
import { BSFF_WASTE_CODES } from "../common/constants";
import {
  foreignVatNumber,
  siret,
  siretConditions,
  siretTests,
  transporterRecepisseSchema,
  vatNumberTests,
  weight,
  weightConditions,
  WeightUnits
} from "../common/validation";
import { UserInputError } from "../common/errors";
import { getOperationModesFromOperationCode } from "../common/operationModes";

configureYup();

type Emitter = Pick<
  Prisma.BsffCreateInput,
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
>;

type Destination = Pick<
  Prisma.BsffCreateInput,
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
  | "destinationPlannedOperationCode"
>;

type Transporter = Pick<
  Prisma.BsffCreateInput,
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyVatNumber"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterRecepisseNumber"
  | "transporterRecepisseDepartment"
  | "transporterRecepisseValidityLimit"
  | "transporterRecepisseIsExempted"
>;

type WasteDetails = Pick<
  Prisma.BsffCreateInput,
  | "wasteCode"
  | "wasteDescription"
  | "wasteAdr"
  | "weightValue"
  | "weightIsEstimate"
> & { packagings?: Omit<BsffPackaging, "__typename">[] };

type Transport = Pick<
  Prisma.BsffCreateInput,
  "transporterTransportMode" | "transporterTransportTakenOverAt"
>;

type Reception = Pick<Prisma.BsffCreateInput, "destinationReceptionDate">;

type Acceptation = Pick<
  Prisma.BsffPackagingCreateInput,
  "acceptationWeight" | "acceptationStatus" | "acceptationRefusalReason"
>;

type Operation = Pick<
  Prisma.BsffPackagingCreateInput,
  | "operationDate"
  | "operationCode"
  | "operationMode"
  | "operationNoTraceability"
  | "operationNextDestinationPlannedOperationCode"
  | "operationNextDestinationCap"
  | "operationNextDestinationCompanyName"
  | "operationNextDestinationCompanySiret"
  | "operationNextDestinationCompanyVatNumber"
  | "operationNextDestinationCompanyAddress"
  | "operationNextDestinationCompanyContact"
  | "operationNextDestinationCompanyPhone"
  | "operationNextDestinationCompanyMail"
>;

// Validation function can be called either on an existing Bsff
// or on a create payload
export type BsffLike = (Bsff | Prisma.BsffCreateInput) & {
  packagings?: Pick<
    BsffPackaging,
    "type" | "name" | "other" | "numero" | "volume" | "weight"
  >[];
};

// Context used to determine if some fields are required or not
type BsffValidationContext = {
  isDraft: boolean;
  transporterSignature: boolean;
};

export const emitterSchemaFn: FactorySchemaOf<
  Pick<BsffValidationContext, "isDraft">,
  Emitter
> = ({ isDraft }) =>
  yup.object({
    emitterCompanyName: yup
      .string()
      .requiredIf(!isDraft, "Émetteur : le nom de l'établissement est requis"),
    emitterCompanySiret: siret
      .label("Émetteur")
      .requiredIf(
        !isDraft,
        "Émetteur : le n°SIRET de l'établissement est requis"
      ),
    emitterCompanyAddress: yup
      .string()
      .requiredIf(
        !isDraft,
        "Émetteur : l'adresse de l'établissement est requise"
      ),
    emitterCompanyContact: yup
      .string()
      .requiredIf(!isDraft, "Émetteur : le nom du contact est requis"),
    emitterCompanyPhone: yup
      .string()
      .requiredIf(!isDraft, "Émetteur : le numéro de téléphone est requis"),
    emitterCompanyMail: yup
      .string()
      .email("Émetteur : l'adresse email est invalide")
      .requiredIf(!isDraft, "Émetteur : l'adresse email est requise")
  });

export const transporterSchemaFn: FactorySchemaOf<
  BsffValidationContext,
  Transporter
> = ({ transporterSignature }) => {
  return yup.object({
    transporterTransportPlates: yup
      .array()
      .of(yup.string())
      .max(2, "Un maximum de 2 plaques d'immatriculation est accepté")
      .test((transporterTransportPlates, ctx) => {
        const { transporterTransportMode } = ctx.parent;

        if (
          transporterSignature &&
          transporterTransportMode === "ROAD" &&
          (!transporterTransportPlates ||
            !transporterTransportPlates?.filter(p => Boolean(p)).length)
        ) {
          return new yup.ValidationError(
            "La plaque d'immatriculation est requise"
          );
        }

        return true;
      }),
    transporterCompanyName: yup
      .string()
      .requiredIf(
        transporterSignature,
        "Transporteur : le nom de l'établissement est requis"
      ),
    transporterCompanySiret: siret
      .label("Transporteur")
      .requiredIf(
        transporterSignature,
        "Transporteur : Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire"
      )
      .when("transporterCompanyVatNumber", siretConditions.companyVatNumber)
      .test(siretTests.isRegistered("TRANSPORTER")),
    transporterCompanyVatNumber: foreignVatNumber
      .label("Transporteur")
      .test(vatNumberTests.isRegisteredTransporter),
    transporterCompanyAddress: yup
      .string()
      .requiredIf(
        transporterSignature,
        "Transporteur : l'adresse de l'établissement est requise"
      ),
    transporterCompanyContact: yup
      .string()
      .requiredIf(
        transporterSignature,
        "Transporteur : le nom du contact est requis"
      ),
    transporterCompanyPhone: yup
      .string()
      .requiredIf(
        transporterSignature,
        "Transporteur : le numéro de téléphone est requis"
      ),
    transporterCompanyMail: yup
      .string()
      .email("Transporteur : l'adresse email est invalide")
      .requiredIf(
        transporterSignature,
        "Transporteur : l'adresse email est requise"
      ),
    ...transporterRecepisseSchema({ transportSignature: transporterSignature })
  });
};

export const wasteDetailsSchemaFn: FactorySchemaOf<
  Pick<BsffValidationContext, "isDraft">,
  WasteDetails
> = ({ isDraft }) => {
  const packagings = isDraft
    ? yup.array().nullable().notRequired()
    : yup
        .array()
        .min(
          1,
          "Conditionnements : le nombre de contenants doit être supérieur ou égal à 1"
        )
        .of<
          yup.SchemaOf<
            Pick<
              PrismaBsffPackaging,
              "type" | "other" | "numero" | "volume" | "weight"
            >
          >
        >(
          yup.object({
            type: yup
              .mixed<BsffPackagingType>()
              .required("Conditionnements : le type de contenant est requis"),
            other: yup
              .string()
              .when("type", (type, schema) =>
                type === "AUTRE"
                  ? schema.requiredIf(
                      !isDraft,
                      "La description doit être précisée pour le conditionnement 'AUTRE'."
                    )
                  : schema
                      .nullable()
                      .max(
                        0,
                        "La description ne peut être renseigné que lorsque le type de conditionnement est 'AUTRE'."
                      )
              ) as any,
            volume: yup
              .number()
              .nullable()
              .notRequired()
              .positive(
                "Conditionnements : le volume doit être supérieur à 0"
              ) as any,
            numero: yup
              .string()
              .ensure()
              .required(
                "Conditionnements : le numéro d'identification est requis"
              ),

            weight: weight(WeightUnits.Kilogramme)
              .label("Conditionnement")
              .required("${path} :Le poids est requis")
              .positive("${path} : le poids doit être supérieur à 0")
          })
        );

  return yup.object({
    wasteCode: yup
      .string()
      .nullable()
      .oneOf(
        [null, ...BSFF_WASTE_CODES],
        "Le code déchet ne fait pas partie de la liste reconnue : ${values}"
      )
      .requiredIf(!isDraft, "Le code déchet est requis"),
    wasteDescription: yup
      .string()
      .requiredIf(
        !isDraft,
        "La dénomination usuelle du déchet est obligatoire"
      ),
    wasteAdr: yup.string().requiredIf(!isDraft, "La mention ADR est requise"),
    weightValue: weight(WeightUnits.Kilogramme)
      .label("Déchet")
      .when(
        ["transporterTransportMode", "createdAt"],
        weightConditions.transportMode(WeightUnits.Kilogramme)
      )
      .positive("Le poids doit être supérieur à 0")
      .requiredIf(!isDraft, "Le poids total est requis"),
    weightIsEstimate: yup
      .boolean()
      .requiredIf(!isDraft, "Le type de poids (estimé ou non) est un requis"),
    packagings: packagings as any
  });
};

export const destinationSchemaFn: FactorySchemaOf<
  Pick<BsffValidationContext, "isDraft">,
  Destination
> = ({ isDraft }) =>
  yup.object({
    destinationCompanyName: yup
      .string()
      .nullable()
      .requiredIf(
        !isDraft,
        "Destination : le nom de l'établissement est requis"
      ),
    destinationCompanySiret: siret
      .label("Destination")
      .requiredIf(!isDraft, `Destination : le numéro SIRET est requis`)
      .test(siretTests.isRegistered("DESTINATION")),
    destinationCompanyAddress: yup
      .string()
      .requiredIf(
        !isDraft,
        "Destination : l'adresse de l'établissement est requise"
      ),
    destinationCompanyContact: yup
      .string()
      .requiredIf(!isDraft, "Destination : le nom du contact est requis"),
    destinationCompanyPhone: yup
      .string()
      .requiredIf(!isDraft, "Destination : le numéro de téléphone est requis"),
    destinationCompanyMail: yup
      .string()
      .email("Destination : l'adresse email est invalide")
      .requiredIf(!isDraft, "Destination : l'adresse email est requise"),
    destinationPlannedOperationCode: yup
      .string()
      .nullable()
      .oneOf(
        [null, ...Object.keys(OPERATION)],
        `Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${Object.keys(
          OPERATION
        ).join(", ")}`
      )
      .requiredIf(
        !isDraft,
        "Le code de l'opération de traitement prévu est requis"
      )
  });

export const transportSchema: yup.SchemaOf<Transport> = yup.object({
  transporterTransportMode: yup
    .mixed<TransportMode>()
    .nullable()
    .oneOf(
      [null, ...Object.values(TransportMode)],
      "Le mode de transport ne fait pas partie de la liste reconnue : ${values}"
    )
    .required("Le mode de transport utilisé par le transporteur est requis"),
  transporterTransportTakenOverAt: yup
    .date()
    .required("La date de prise en charge par le transporteur est requise")
});

export const receptionSchema: yup.SchemaOf<Reception> = yup.object({
  destinationReceptionDate: yup
    .date()
    .nullable()
    .required("La date de réception du déchet est requise") as any // https://github.com/jquense/yup/issues/1302
});

export const acceptationSchema: yup.SchemaOf<Acceptation> = yup.object({
  acceptationStatus: yup
    .mixed<WasteAcceptationStatus>()
    .required()
    .notOneOf(
      [WasteAcceptationStatus.PARTIALLY_REFUSED],
      "Le refus partiel n'est pas autorisé dans le cas d'un BSFF"
    ),
  acceptationRefusalReason: yup
    .string()
    .when("acceptationStatus", (acceptationStatus, schema) =>
      acceptationStatus === WasteAcceptationStatus.REFUSED
        ? schema.ensure().required("Vous devez saisir un motif de refus")
        : schema
            .ensure()
            .max(
              0,
              "Le motif du refus ne doit pas être renseigné si le déchet est accepté"
            )
    ),
  acceptationWeight: weight(WeightUnits.Kilogramme)
    .label("Acceptation")
    .required("Le poids en kilogramme du déchet reçu est requis")
    .when("acceptationStatus", weightConditions.wasteAcceptationStatus as any),
  acceptationWasteCode: yup
    .string()
    .nullable()
    .oneOf(
      [null, ...BSFF_WASTE_CODES],
      `Le code déchet ne fait pas partie de la liste reconnue : ${BSFF_WASTE_CODES.join(
        ", "
      )}`
    ),
  acceptationWasteDescription: yup.string()
});

const withNextDestination = (required: boolean) =>
  yup.object().shape({
    operationNextDestinationPlannedOperationCode: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        "Destination ultérieure : le code de l'opération de traitement est requis"
      )
      .oneOf(
        ["", ...Object.keys(OPERATION)],
        "Destination ultérieure : Le code de l'opération de traitement ne fait pas partie de la liste reconnue : ${values}"
      ),
    operationNextDestinationCap: yup.string().nullable().notRequired(),
    operationNextDestinationCompanyName: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        "Destination ultérieure : le nom de l'établissement est requis"
      ),
    operationNextDestinationCompanySiret: siret
      .label("Destination ultérieure")
      .requiredIf(
        required,
        "Destination ultérieure : Le n° SIRET ou le n°TVA intracommunautaire est obligatoire"
      )
      .when(
        "operationNextDestinationCompanyVatNumber",
        siretConditions.companyVatNumber
      ),
    operationNextDestinationCompanyVatNumber: foreignVatNumber.label(
      "Destination ultérieure"
    ),
    operationNextDestinationCompanyAddress: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : l'adresse de l'établissement est requis`
      ),
    operationNextDestinationCompanyContact: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : le nom du contact est requis`
      ),
    operationNextDestinationCompanyPhone: yup
      .string()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : le numéro de téléphone est requis`
      ),
    operationNextDestinationCompanyMail: yup
      .string()
      .email()
      .ensure()
      .requiredIf(
        required,
        `Destination ultérieure : l'adresse email est requise`
      )
  });

const EXTRANEOUS_NEXT_DESTINATION = `L'opération de traitement renseignée ne permet pas de destination ultérieure`;

const withoutNextDestination = yup.object().shape({
  operationNextDestinationPlannedOperationCode: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  operationNextDestinationCap: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  operationNextDestinationCompanyName: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  operationNextDestinationCompanySiret: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  operationNextDestinationCompanyVatNumber: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  operationNextDestinationCompanyAddress: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  operationNextDestinationCompanyContact: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  operationNextDestinationCompanyPhone: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION),
  operationNextDestinationCompanyMail: yup
    .string()
    .ensure()
    .max(0, EXTRANEOUS_NEXT_DESTINATION)
});

const traceabilityBreakAllowed = yup.object({
  operationNoTraceability: yup.boolean().nullable() as any
});

const traceabilityBreakForbidden = yup.object({
  operationNoTraceability: yup
    .boolean()
    .nullable()
    .notOneOf(
      [true],
      "Vous ne pouvez pas indiquer une rupture de traçabilité avec un code de traitement final"
    ) as any
});

const operationSchemaFn: (value: any) => yup.SchemaOf<Operation> = value => {
  const base = yup.object({
    operationDate: yup
      .date()
      .nullable()
      .required("La date de l'opération est requise"),
    operationCode: yup
      .string()
      .ensure()
      .required("Le code de l'opération de traitement est requis")
      .oneOf(
        Object.keys(OPERATION),
        "Le code de l'opération de traitement ne fait pas partie de la liste reconnue : ${values}"
      ),
    operationMode: yup
      .mixed<OperationMode | null | undefined>()
      .oneOf([...Object.values(OperationMode), null, undefined])
      .nullable()
      .test(
        "processing-mode-matches-processing-operation",
        "Le mode de traitement n'est pas compatible avec l'opération de traitement choisie",
        function (item) {
          const { operationCode } = this.parent;
          const operationMode = item;

          if (operationCode && operationMode) {
            const modes = getOperationModesFromOperationCode(operationCode);
            console.log("modes", modes);
            return modes.includes(operationMode ?? "");
          }

          return true;
        }
      )
  });

  if (!isFinalOperation(value.operationCode)) {
    if (value?.operationNoTraceability === true) {
      return base
        .concat(withNextDestination(false))
        .concat(traceabilityBreakAllowed);
    }
    return base
      .concat(withNextDestination(true))
      .concat(traceabilityBreakAllowed);
  } else {
    return base
      .concat(withoutNextDestination)
      .concat(traceabilityBreakForbidden);
  }
};

export const operationSchema = yup.lazy(operationSchemaFn);

const bsffSchemaFn = (bsff: BsffValidationContext) =>
  emitterSchemaFn(bsff)
    .concat(wasteDetailsSchemaFn(bsff))
    .concat(transporterSchemaFn(bsff))
    .concat(destinationSchemaFn(bsff));

export async function validateBsff(
  bsff: BsffLike,
  context: BsffValidationContext
) {
  try {
    const validationSchema = bsffSchemaFn(context);
    await validationSchema.validate(bsff, {
      abortEarly: false
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const stringifiedErrors = err.errors?.join("\n");
      throw new UserInputError(
        `Erreur de validation des données. Des champs sont manquants ou mal formatés : \n${stringifiedErrors}`
      );
    } else {
      throw err;
    }
  }
}

export async function validateFicheInterventions(
  bsff: BsffLike,
  ficheInterventions: BsffFicheIntervention[]
) {
  if (ficheInterventions.length === 0) {
    return;
  }

  const allowedTypes: BsffType[] = [BsffType.COLLECTE_PETITES_QUANTITES];
  if (!bsff.type || !allowedTypes.includes(bsff.type)) {
    throw new UserInputError(
      `Le type de BSFF choisi ne permet pas d'associer des fiches d'intervention.`
    );
  }

  for (const ficheIntervention of ficheInterventions) {
    if (
      bsff.emitterCompanySiret &&
      ficheIntervention.operateurCompanySiret &&
      bsff.emitterCompanySiret !== ficheIntervention.operateurCompanySiret
    ) {
      throw new UserInputError(
        `L'opérateur identifié sur la fiche d'intervention ${ficheIntervention.numero} ne correspond pas à l'émetteur de BSFF`
      );
    }
  }
}

/**
 * Les vérifications suivantes sont effectuées :
 * - Vérifie que le type du BSFF est compatible avec la valeur de `forwarding`, `grouping` et `repackaging`.
 * - Vérifie que le SIRET de l'installation émettrice est renseigné
 * - Vérifie que l'utilisateur n'essaye pas de rensigner des informations sur les contenants en cas de groupement
 * ou reéxpédition (c'est calculé automatiquement à partir des infos des contenants initiaux).
 * - Vérifie qu'un seul contenant est spécifié en cas de reconditionnement
 * - Vérifie que les identifiants de contenants existent
 * - Vérifie pour chaque contenant initial que :
 *   - il a bien été traité avec un code de traitement compatible
 *   - il a bien pour destination le SIRET de l'installation émettrice du BSFF de groupement / reconditionnement / reéxpédition
 *   - il n'a pas été inclus dans un autre BSFF de groupement / reconditionnement / reéxpédition
 */
export async function validatePreviousPackagings(
  bsff: BsffLike,
  previousPackagingsIds: {
    forwarding?: string[] | null;
    grouping?: string[] | null;
    repackaging?: string[] | null;
  }
): Promise<PrismaBsffPackaging[]> {
  const { forwarding, grouping, repackaging } = previousPackagingsIds;

  const isForwarding = forwarding && forwarding.length > 0;
  const isRepackaging = repackaging && repackaging.length > 0;
  const isGrouping = grouping && grouping.length > 0;

  if (isForwarding && bsff.type !== BsffType.REEXPEDITION) {
    throw new UserInputError(
      "Vous devez sélectionner le type de BSFF `REEXPEDITION` avec le paramètre `forwarding`"
    );
  }

  if (isRepackaging && bsff.type !== BsffType.RECONDITIONNEMENT) {
    throw new UserInputError(
      "Vous devez sélectionner le type de BSFF `RECONDITIONNEMENT` avec le paramètre `repackaging`"
    );
  }

  if (isGrouping && bsff.type !== BsffType.GROUPEMENT) {
    throw new UserInputError(
      "Vous devez sélectionner le type de BSFF `GROUPEMENT` avec le paramètre `repackaging`"
    );
  }

  if (
    (isForwarding || isRepackaging || isGrouping) &&
    !bsff.emitterCompanySiret
  ) {
    throw new UserInputError(
      "Vous devez renseigner le siret de l'installation émettrice du nouveau BSFF en cas de groupement, réexpédition ou reéxpédition"
    );
  }

  if (isRepackaging && bsff.packagings && bsff.packagings.length > 1) {
    throw new UserInputError(
      "Vous ne pouvez saisir qu'un seul contenant lors d'une opération de reconditionnement"
    );
  }

  // contenants qui sont réexpédiés dans ce BSFF
  const forwardedPackagings = isForwarding
    ? await prisma.bsffPackaging.findMany({
        where: { id: { in: forwarding } },
        include: { bsff: true, nextPackaging: { select: { bsffId: true } } }
      })
    : [];

  if (isForwarding && forwardedPackagings.length < forwarding.length) {
    const notFoundIds = forwarding.filter(
      id => !forwardedPackagings.map(p => p.id).includes(id)
    );
    throw new UserInputError(
      `Les identifiants de contenants de fluide à réexpédiés ${notFoundIds.join(
        ", "
      )} n'existent pas`
    );
  }

  if (isForwarding) {
    const bsffIds = forwardedPackagings.map(p => p.bsffId);
    const areOnSameBsff = bsffIds.every(id => id === bsffIds[0]);
    if (!areOnSameBsff) {
      throw new UserInputError(
        "Tous les contenants réexpédiés doivent apparaitre sur le même BSFF initial"
      );
    }
  }

  const forwardedWasteCodes = [
    ...new Set(
      forwardedPackagings
        .map(p => p.acceptationWasteCode ?? p.bsff?.wasteCode)
        .filter(code => code && code.length > 0)
    )
  ].sort();

  if (forwardedWasteCodes?.length > 1) {
    throw new UserInputError(
      `Vous ne pouvez pas réexpédier des contenants ayant des codes déchet différents : ${forwardedWasteCodes.join(
        ", "
      )}`
    );
  }

  // contenants qui sont reconditionnés dans ce BSFF
  const repackagedPackagings = isRepackaging
    ? await prisma.bsffPackaging.findMany({
        where: { id: { in: repackaging } },
        include: { bsff: true, nextPackaging: { select: { bsffId: true } } }
      })
    : [];

  if (isRepackaging && repackagedPackagings.length < repackaging.length) {
    const notFoundIds = repackaging.filter(
      id => !repackagedPackagings.map(p => p.id).includes(id)
    );
    throw new UserInputError(
      `Les identifiants de contenants de fluide à reconditionner ${notFoundIds.join(
        ", "
      )} n'existent pas`
    );
  }

  // contenants qui sont groupés dans ce BSFF
  const groupedPackagings = isGrouping
    ? await prisma.bsffPackaging.findMany({
        where: { id: { in: grouping } },
        include: { bsff: true, nextPackaging: { select: { bsffId: true } } }
      })
    : [];

  if (isGrouping && groupedPackagings.length < grouping.length) {
    const notFoundIds = grouping.filter(
      id => !groupedPackagings.map(p => p.id).includes(id)
    );
    throw new UserInputError(
      `Les identifiants de contenants de fluide à grouper ${notFoundIds.join(
        ", "
      )} n'existent pas`
    );
  }

  const groupedWasteCodes = [
    ...new Set(
      groupedPackagings.map(p => p.acceptationWasteCode ?? p.bsff?.wasteCode)
    )
  ].sort();

  if (groupedWasteCodes?.length > 1) {
    throw new UserInputError(
      `Vous ne pouvez pas regrouper des contenants ayant des codes déchet différents : ${groupedWasteCodes.join(
        ", "
      )}`
    );
  }

  const previousPackagings = [
    ...(isForwarding ? forwardedPackagings : []),
    ...(isGrouping ? groupedPackagings : []),
    ...(isRepackaging ? repackagedPackagings : [])
  ];

  if (
    previousPackagings.length === 0 &&
    [
      BsffType.GROUPEMENT,
      BsffType.REEXPEDITION,
      BsffType.RECONDITIONNEMENT
    ].includes(bsff.type as any)
  ) {
    throw new UserInputError(
      "Vous devez saisir des contenants en transit en cas de groupement, reconditionnement ou réexpédition"
    );
  }

  const errors = previousPackagings.reduce((acc, packaging) => {
    if (packaging.bsff.destinationCompanySiret !== bsff.emitterCompanySiret) {
      return [
        ...acc,
        `Le BSFF ${packaging.bsffId} sur lequel apparait le contenant ${packaging.id} (${packaging.numero}) ` +
          `n'a pas été traité sur l'installation émettrice du nouveau BSFF ${bsff.emitterCompanySiret}`
      ];
    }

    if (!packaging.operationSignatureDate) {
      return [
        ...acc,
        `La signature de l'opération n'a pas encore été faite sur le contenant ${packaging.id} - ${packaging.numero}`
      ];
    }

    const operation = OPERATION[packaging.operationCode as BsffOperationCode];
    if (!bsff.type || !operation.successors.includes(bsff.type)) {
      return [
        ...acc,
        `Une opération de traitement finale a été déclarée sur le contenant n°${packaging.id} (${packaging.numero}). ` +
          `Vous ne pouvez pas l'ajouter sur un BSFF de groupement, reconditionnement ou réexpédition`
      ];
    }

    if (
      !!packaging.nextPackagingId &&
      packaging.nextPackaging!.bsffId !== bsff.id
    ) {
      return [
        ...acc,
        `Le contenant n°${packaging.id} (${packaging.numero}) a déjà été réexpédié, reconditionné ou groupé dans un autre BSFF.`
      ];
    }

    return acc;
  }, []);

  if (errors.length > 0) {
    throw new UserInputError(errors.join("\n"));
  }

  return previousPackagings;
}

const beforeEmissionSchemaFn = (
  bsff: BsffLike,
  context: BsffValidationContext
) =>
  bsffSchemaFn(context).concat(
    yup.object({
      isDraft: yup
        .boolean()
        .oneOf(
          [false],
          "Il n'est pas possible de signer un BSFF à l'état de brouillon"
        ),
      emitterEmissionSignatureDate: yup
        .date()
        .nullable()
        .test(
          "is-not-signed",
          "L'entreprise émettrice a déjà signé ce bordereau",
          value => value == null
        ) as any // https://github.com/jquense/yup/issues/1302
    })
  );

export function validateBeforeEmission(bsff: BsffLike) {
  return beforeEmissionSchemaFn(bsff, {
    isDraft: false,
    transporterSignature: false
  }).validate(bsff, {
    abortEarly: false
  });
}

const beforeTransportSchemaFn = (
  bsff: BsffLike,
  context: BsffValidationContext
) =>
  bsffSchemaFn(context)
    .concat(transportSchema)
    .concat(
      yup.object({
        emitterEmissionSignatureDate: yup
          .date()
          .nullable()
          .required(
            "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
          ) as any, // https://github.com/jquense/yup/issues/1302
        transporterTransportSignatureDate: yup
          .date()
          .nullable()
          .test(
            "is-not-signed",
            "Le transporteur a déjà signé ce bordereau",
            value => value == null
          ) as any // https://github.com/jquense/yup/issues/1302
      })
    );

export function validateBeforeTransport(bsff: BsffLike) {
  return beforeTransportSchemaFn(bsff, {
    isDraft: false,
    transporterSignature: true
  }).validate(bsff, {
    abortEarly: false
  });
}

export const beforeReceptionSchemaFn = (
  bsff: BsffLike,
  context: BsffValidationContext
) =>
  bsffSchemaFn(context)
    .concat(transportSchema)
    .concat(receptionSchema)
    .concat(
      yup.object({
        transporterTransportSignatureDate: yup
          .date()
          .nullable()
          .required(
            "L'installation de destination ne peut pas signer la réception avant que le transporteur ait signé le bordereau"
          ) as any, // https://github.com/jquense/yup/issues/1302
        destinationReceptionSignatureDate: yup
          .date()
          .nullable()
          .test(
            "is-not-signed",
            "L'installation de destination a déjà signé la réception du déchet",
            value => value == null
          ) as any // https://github.com/jquense/yup/issues/1302
      })
    );

export function validateBeforeReception(bsff: BsffLike) {
  return beforeReceptionSchemaFn(bsff, {
    isDraft: false,
    transporterSignature: true
  }).validate(bsff, {
    abortEarly: false
  });
}

export const afterReceptionSchemaFn = (context: BsffValidationContext) =>
  bsffSchemaFn(context)
    .concat(transportSchema)
    .concat(receptionSchema)
    .concat(
      yup.object({
        destinationReceptionSignatureDate: yup
          .date()
          .nullable()
          .required(
            "L'installation de destination n'a pas encore signé la réception"
          )
      })
    );

export function validateAfterReception(bsff: BsffLike) {
  return afterReceptionSchemaFn({
    isDraft: false,
    transporterSignature: true
  }).validate(bsff, {
    abortEarly: false
  });
}

export function validateBeforeAcceptation(
  bsffPackaging: (typeof acceptationSchema)["__outputType"]
) {
  return acceptationSchema.validate(bsffPackaging, {
    abortEarly: false
  });
}

const beforeOperationSchema = yup.lazy(value =>
  acceptationSchema.concat(operationSchemaFn(value)).concat(
    yup.object({
      acceptationSignatureDate: yup
        .date()
        .nullable()
        .required(
          "L'installation de destination ne peut pas signer le traitement avant d'avoir signé la réception du déchet"
        ) as any // https://github.com/jquense/yup/issues/1302
    })
  )
);

export function validateBeforeOperation(
  bsffPackaging: (typeof beforeOperationSchema)["__outputType"]
) {
  return beforeOperationSchema.validate(bsffPackaging, {
    abortEarly: false
  });
}

export const ficheInterventionSchema: yup.SchemaOf<
  Pick<
    BsffFicheIntervention,
    | "numero"
    | "weight"
    | "postalCode"
    | "detenteurCompanyName"
    | "detenteurCompanySiret"
    | "detenteurCompanyAddress"
    | "detenteurCompanyContact"
    | "detenteurCompanyPhone"
    | "detenteurCompanyMail"
    | "detenteurIsPrivateIndividual"
    | "operateurCompanyName"
    | "operateurCompanySiret"
    | "operateurCompanyAddress"
    | "operateurCompanyContact"
    | "operateurCompanyPhone"
    | "operateurCompanyMail"
  >
> = yup.object({
  numero: yup
    .string()
    .required("Le numéro de la fiche d'intervention est requis"),
  weight: weight(WeightUnits.Kilogramme).required(
    "Le poids en kilogramme est requis"
  ),
  postalCode: yup
    .string()
    .required("Le code postal du lieu de l'intervention est requis"),
  detenteurIsPrivateIndividual: yup.boolean() as any,
  detenteurCompanySiret: siret
    .label("Détenteur")
    .required("Le SIRET de l'entreprise détentrice de l'équipement est requis")
    .when(
      "detenteurIsPrivateIndividual",
      siretConditions.isPrivateIndividual as any
    ),
  detenteurCompanyName: yup
    .string()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema =>
        schema.required(
          "Le nom du détenteur de l'équipement (particulier) est requis"
        ),
      otherwise: schema =>
        schema.required(
          "Le nom de l'entreprise détentrice de l'équipement est requise"
        )
    }),
  detenteurCompanyAddress: yup
    .string()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema =>
        schema.required(
          "L'adresse du détenteur de l'équipement (particulier) est requise"
        ),
      otherwise: schema =>
        schema.required(
          "L'adresse de l'entreprise détentrice de l'équipement est requise"
        )
    }),
  detenteurCompanyContact: yup
    .string()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema => schema.nullable().notRequired(),
      otherwise: schema =>
        schema
          .ensure()
          .required(
            "Le nom du contact de l'entreprise détentrice de l'équipement est requis"
          )
    }),
  detenteurCompanyPhone: yup
    .string()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema => schema.nullable().notRequired(),
      otherwise: schema =>
        schema.required(
          "Le numéro de téléphone de l'entreprise détentrice de l'équipement est requis"
        )
    }),
  detenteurCompanyMail: yup
    .string()
    .email()
    .ensure()
    .when("detenteurIsPrivateIndividual", {
      is: true,
      then: schema => schema.nullable().notRequired(),
      otherwise: schema =>
        schema.required(
          "L'adresse email de l'entreprise détentrice de l'équipement est requis"
        )
    }),
  operateurCompanyName: yup
    .string()
    .required("Le nom de l'entreprise de l'opérateur est requis"),
  operateurCompanySiret: siret.required(
    "Le SIRET de l'entreprise de l'opérateur est requis"
  ),
  operateurCompanyAddress: yup
    .string()
    .required("L'adresse de l'entreprise de l'opérateur est requis"),
  operateurCompanyContact: yup
    .string()
    .required("Le nom du contact de l'entreprise de l'opérateur est requis"),
  operateurCompanyPhone: yup
    .string()
    .required(
      "Le numéro de téléphone de l'entreprise de l'opérateur est requis"
    ),
  operateurCompanyMail: yup
    .string()
    .required("L'adresse email de l'entreprise de l'opérateur est requis")
});

export function validateFicheIntervention(
  ficheIntervention:
    | BsffFicheIntervention
    | Prisma.BsffFicheInterventionCreateInput
    | Prisma.BsffFicheInterventionUpdateInput
) {
  return ficheInterventionSchema.validate(ficheIntervention, {
    abortEarly: false
  });
}
