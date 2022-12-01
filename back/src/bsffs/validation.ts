import * as yup from "yup";
import { UserInputError } from "apollo-server-express";
import {
  Bsff,
  BsffPackaging as PrismaBsffPackaging,
  TransportMode,
  BsffFicheIntervention,
  BsffType,
  Prisma,
  WasteAcceptationStatus
} from "@prisma/client";
import { BsffOperationCode, BsffPackaging } from "../generated/graphql/types";
import { isFinalOperation, OPERATION } from "./constants";
import prisma from "../prisma";
import {
  isVat,
  isSiret,
  isFRVat
} from "../common/constants/companySearchHelpers";
import configureYup, { FactorySchemaOf } from "../common/yup/configureYup";
import { BSFF_WASTE_CODES } from "../common/constants";

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

export const emitterSchemaFn: FactorySchemaOf<boolean, Emitter> = isDraft =>
  yup.object({
    emitterCompanyName: yup
      .string()
      .requiredIf(!isDraft, "Émetteur : le nom de l'établissement est requis"),
    emitterCompanySiret: yup
      .string()
      .requiredIf(
        !isDraft,
        "Émetteur : le n°SIRET de l'établissement est requis"
      )
      .matches(/^$|^\d{14}$/, {
        message:
          "Émetteur : le n°SIRET de l'établissement n'est pas au bon format"
      }),
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

export const transporterSchemaFn: FactorySchemaOf<boolean, Transporter> =
  isDraft =>
    yup.object({
      transporterCompanyName: yup
        .string()
        .requiredIf(
          !isDraft,
          "Transporteur : le nom de l'établissement est requis"
        ),
      transporterCompanySiret: yup
        .string()
        .ensure()
        .when("transporterCompanyVatNumber", (tva, schema) => {
          if (!tva && !isDraft) {
            return schema
              .required(
                "Transporteur : le n° SIRET ou le numéro de TVA intracommunautaire est requis"
              )
              .test(
                "is-siret",
                "Transporteur : le n° SIRET n'est pas au bon format",
                value => isSiret(value)
              );
          }
          if (!isDraft && tva && isFRVat(tva)) {
            return schema.required(
              "Transporteur : le n° SIRET est requis pour un établissement français"
            );
          }
          return schema.nullable().notRequired();
        }),
      transporterCompanyVatNumber: yup
        .string()
        .ensure()
        .test(
          "is-vat",
          "Transporteur : le numéro de TVA intracommunautaire n'est pas au bon format",
          value => !value || isVat(value)
        ),
      transporterCompanyAddress: yup
        .string()
        .requiredIf(
          !isDraft,
          "Transporteur : l'adresse de l'établissement est requise"
        ),
      transporterCompanyContact: yup
        .string()
        .requiredIf(!isDraft, "Transporteur : le nom du contact est requis"),
      transporterCompanyPhone: yup
        .string()
        .requiredIf(
          !isDraft,
          "Transporteur : le numéro de téléphone est requis"
        ),
      transporterCompanyMail: yup
        .string()
        .email("Transporteur : l'adresse email est invalide")
        .requiredIf(!isDraft, "Transporteur : l'adresse email est requise"),
      transporterRecepisseNumber: yup.string().nullable(),
      transporterRecepisseDepartment: yup.string().nullable(),
      transporterRecepisseValidityLimit: yup.date().nullable()
    });

export const wasteDetailsSchemaFn: FactorySchemaOf<boolean, WasteDetails> =
  isDraft => {
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
                .mixed()
                .required("Conditionnements : le type de contenant est requis"),
              other: yup.string().notRequired().nullable(),
              volume: yup
                .number()
                .required("Conditionnements : le volume est requis")
                .positive(
                  "Conditionnements : le volume doit être supérieur à 0"
                ),
              numero: yup
                .string()
                .ensure()
                .required(
                  "Conditionnements : le numéro d'identification est requis"
                ),
              weight: yup
                .number()
                .required("Conditionnements : Le poids est requis")
                .positive("Conditionnements : le poids doit être supérieur à 0")
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
      weightValue: yup
        .number()
        .positive("Le poids doit être supérieur à 0")
        .requiredIf(!isDraft, "Le poids total est requis"),
      weightIsEstimate: yup
        .boolean()
        .requiredIf(!isDraft, "Le type de poids (estimé ou non) est un requis"),
      packagings: packagings as any
    });
  };

export const destinationSchemaFn: FactorySchemaOf<boolean, Destination> =
  isDraft =>
    yup.object({
      destinationCompanyName: yup
        .string()
        .nullable()
        .requiredIf(
          !isDraft,
          "Destination : le nom de l'établissement est requis"
        ),
      destinationCompanySiret: yup
        .string()
        .requiredIf(
          !isDraft,
          "Destination : le n°SIRET de l'établissement est requis"
        )
        .matches(/^$|^\d{14}$/, {
          message: "Destination : le n°SIRET n'est pas au bon format"
        }),
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
        .requiredIf(
          !isDraft,
          "Destination : le numéro de téléphone est requis"
        ),
      destinationCompanyMail: yup
        .string()
        .email("Destination : l'adresse email est invalide")
        .requiredIf(!isDraft, "Destination : l'adresse email est requise"),
      destinationPlannedOperationCode: yup
        .string()
        .nullable()
        .oneOf(
          [null, ...Object.keys(OPERATION)],
          "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${values}"
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
  acceptationWeight: yup
    .number()
    .nullable()
    .required("Le poids en kilos du déchet reçu est requis")
    .when("acceptationStatus", {
      is: value => value === WasteAcceptationStatus.REFUSED,
      then: schema =>
        schema.oneOf(
          [0],
          "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
        ),
      otherwise: schema =>
        schema.positive("Vous devez saisir une quantité reçue supérieure à 0")
    }),
  acceptationWasteCode: yup
    .string()
    .nullable()
    .required("Le code déchet après analyse est requis")
    .oneOf(
      BSFF_WASTE_CODES,
      "Le code déchet ne fait pas partie de la liste reconnue : ${values}"
    ),
  acceptationWasteDescription: yup
    .string()
    .ensure()
    .required("La description du déchet après analyse est requise")
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
    operationNextDestinationCompanySiret: yup
      .string()
      .when("operationNextDestinationCompanyVatNumber", (vatNumber, schema) => {
        return !!vatNumber
          ? schema.notRequired().nullable()
          : schema
              .ensure()
              .requiredIf(
                required,
                "Destination ultérieure : Le n° SIRET ou le n°TVA intracommunautaire est obligatoire"
              )
              .test(
                "is-14-charachters",
                `Destination ultérieure prévue : le n°SIRET doit faire 14 caractères`,
                value => !value || value?.length === 14
              );
      }),
    operationNextDestinationCompanyVatNumber: yup
      .string()
      .notRequired()
      .nullable()
      .test(
        "is-vat",
        "${path} n'est pas un numéro de TVA intracommunautaire valide",
        value => !value || isVat(value)
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
  operationNoTraceability: yup.boolean().nullable()
});

const traceabilityBreakForbidden = yup.object({
  operationNoTraceability: yup
    .boolean()
    .nullable()
    .notOneOf(
      [true],
      "Vous ne pouvez pas indiquer une rupture de traçabilité avec un code de traitement final"
    )
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

// validation schema for BSFF before it can be published
const baseBsffSchemaFn = (isDraft: boolean) =>
  emitterSchemaFn(isDraft)
    .concat(wasteDetailsSchemaFn(isDraft))
    .concat(transporterSchemaFn(isDraft))
    .concat(destinationSchemaFn(isDraft));

export const bsffSchema = baseBsffSchemaFn(false);
export const draftBsffSchema = baseBsffSchemaFn(true);

export async function validateBsff(
  bsff: Partial<Bsff | Prisma.BsffCreateInput> & {
    packagings?: Pick<
      BsffPackaging,
      "type" | "other" | "numero" | "volume" | "weight"
    >[];
  }
) {
  try {
    const validationSchema = bsff.isDraft ? draftBsffSchema : bsffSchema;
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
  bsff: Partial<Bsff | Prisma.BsffCreateInput> & {
    packagings?: Partial<BsffPackaging>[];
  },
  ficheInterventions: BsffFicheIntervention[]
) {
  if (ficheInterventions.length === 0) {
    return;
  }

  const allowedTypes: BsffType[] = [
    BsffType.TRACER_FLUIDE,
    BsffType.COLLECTE_PETITES_QUANTITES
  ];
  if (!allowedTypes.includes(bsff.type)) {
    throw new UserInputError(
      `Le type de bordereau choisi ne permet pas d'associer des fiches d'intervention.`
    );
  }

  if (bsff.type === BsffType.TRACER_FLUIDE && ficheInterventions.length > 1) {
    throw new UserInputError(
      `Le type de bordereau choisi ne permet pas d'associer plusieurs fiches d'intervention.`
    );
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
  bsff: Partial<Bsff | Prisma.BsffCreateInput> & {
    packagings?: Partial<BsffPackaging>[];
  },
  previousPackagingsIds: {
    forwarding?: string[];
    grouping?: string[];
    repackaging?: string[];
  }
): Promise<PrismaBsffPackaging[]> {
  const { forwarding, grouping, repackaging } = previousPackagingsIds;

  const isForwarding = forwarding?.length > 0;
  const isRepackaging = repackaging?.length > 0;
  const isGrouping = grouping?.length > 0;

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

  if (isRepackaging && bsff.packagings?.length > 1) {
    throw new UserInputError(
      "Vous ne pouvez saisir qu'un seul contenant lors d'une opération de reconditionnement"
    );
  }

  // contenants qui sont réexpédiés dans ce BSFF
  const forwardedPackagings = isForwarding
    ? await prisma.bsffPackaging.findMany({
        where: { id: { in: forwarding } },
        include: { bsff: true }
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

  // contenants qui sont reconditionnés dans ce BSFF
  const repackagedPackagings = isRepackaging
    ? await prisma.bsffPackaging.findMany({
        where: { id: { in: repackaging } },
        include: { bsff: true }
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
        include: { bsff: true }
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

  if (isForwarding) {
    const bsffIds = forwardedPackagings.map(p => p.bsffId);
    const areOnSameBsff = bsffIds.every(id => id === bsffIds[0]);
    if (!areOnSameBsff) {
      throw new UserInputError(
        "Tous les contenants réexpédiés doivent apparaitre sur le même BSFF initial"
      );
    }
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
    if (!operation.successors.includes(bsff.type)) {
      return [
        ...acc,
        `Une opération de traitement finale a été déclarée sur le contenant n°${packaging.id} (${packaging.numero}). ` +
          `Vous ne pouvez pas l'ajouter sur un BSFF de groupement, reconditionnement ou réexpédition`
      ];
    }

    if (
      !!packaging.nextPackagingId &&
      !bsff.packagings?.map(p => p.id).includes(packaging.nextPackagingId)
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

const beforeEmissionSchema = bsffSchema.concat(
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

export function validateBeforeEmission(
  bsff: typeof beforeEmissionSchema["__outputType"]
) {
  return beforeEmissionSchema.validate(bsff, {
    abortEarly: false
  });
}

const beforeTransportSchema = bsffSchema.concat(transportSchema).concat(
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

export function validateBeforeTransport(
  bsff: typeof beforeTransportSchema["__outputType"]
) {
  return beforeTransportSchema.validate(bsff, {
    abortEarly: false
  });
}

export const beforeReceptionSchema = bsffSchema
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

export function validateBeforeReception(
  bsff: typeof beforeReceptionSchema["__outputType"]
) {
  return beforeReceptionSchema.validate(bsff, {
    abortEarly: false
  });
}

export const afterReceptionSchema = bsffSchema
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

export function validateAfterReception(
  bsff: typeof beforeReceptionSchema["__outputType"]
) {
  return afterReceptionSchema.validate(bsff, {
    abortEarly: false
  });
}

export function validateBeforeAcceptation(
  bsffPackaging: typeof acceptationSchema["__outputType"]
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
  bsffPackaging: typeof beforeOperationSchema["__outputType"]
) {
  return beforeOperationSchema.validate(bsffPackaging, {
    abortEarly: false
  });
}

const ficheInterventionSchema: yup.SchemaOf<
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
  weight: yup.number().required("Le poids en kilos est requis"),
  postalCode: yup
    .string()
    .required("Le code postal du lieu de l'intervention est requis"),
  detenteurCompanyName: yup
    .string()
    .required("Le nom de l'entreprise détentrice de l'équipement est requis"),
  detenteurCompanySiret: yup
    .string()
    .required("Le SIRET de l'entreprise détentrice de l'équipement est requis")
    .matches(/^$|^\d{14}$/, {
      message:
        "Le SIRET de l'entreprise détentrice de l'équipement n'est pas au bon format (${length} caractères)"
    }),
  detenteurCompanyAddress: yup
    .string()
    .required(
      "L'addresse de l'entreprise détentrice de l'équipement est requise"
    ),
  detenteurCompanyContact: yup
    .string()
    .required(
      "Le nom du contact de l'entreprise détentrice de l'équipement est requis"
    ),
  detenteurCompanyPhone: yup
    .string()
    .required(
      "Le numéro de téléphone de l'entreprise détentrice de l'équipement est requis"
    ),
  detenteurCompanyMail: yup
    .string()
    .required(
      "L'addresse email de l'entreprise détentrice de l'équipement est requis"
    ),
  operateurCompanyName: yup
    .string()
    .required("Le nom de l'entreprise de l'opérateur est requis"),
  operateurCompanySiret: yup
    .string()
    .required("Le SIRET de l'entreprise de l'opérateur est requis")
    .matches(/^$|^\d{14}$/, {
      message:
        "Le SIRET de l'entreprise de l'opérateur n'est pas au bon format (${length} caractères)"
    }),
  operateurCompanyAddress: yup
    .string()
    .required("L'addresse de l'entreprise de l'opérateur est requis"),
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
    .required("L'addresse email de l'entreprise de l'opérateur est requis")
});

export function validateFicheIntervention(
  ficheIntervention: typeof ficheInterventionSchema["__outputType"]
) {
  return ficheInterventionSchema.validate(ficheIntervention, {
    abortEarly: false
  });
}
