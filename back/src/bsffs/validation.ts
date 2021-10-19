import type { SetOptional } from "type-fest";
import * as yup from "yup";
import { UserInputError } from "apollo-server-express";
import {
  Bsff,
  TransportMode,
  BsffFicheIntervention,
  BsffStatus,
  BsffType,
  WasteAcceptationStatus
} from "@prisma/client";
import { BsffOperationCode, BsffPackaging } from "../generated/graphql/types";
import { OPERATION, WASTE_CODES } from "./constants";
import prisma from "../prisma";

const bsffSchema: yup.SchemaOf<Pick<
  Bsff,
  | "isDraft"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
  | "wasteCode"
  | "wasteAdr"
  | "weightValue"
  | "destinationPlannedOperationCode"
>> = yup.object({
  isDraft: yup.boolean().nullable(),
  emitterCompanyName: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le nom de l'entreprise émettrice est requis")
    }),
  emitterCompanySiret: yup
    .string()
    .nullable()
    .length(
      14,
      "Le SIRET de l'entreprise émettrice n'est pas au bon format (${length} caractères)"
    )
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le SIRET de l'entreprise émettrice est requis")
    }),
  emitterCompanyAddress: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("L'adresse de l'entreprise émettrice est requise")
    }),
  emitterCompanyContact: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "Le nom du contact dans l'entreprise émettrice est requis"
        )
    }),
  emitterCompanyPhone: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "Le numéro de téléphone de l'entreprise émettrice est requis"
        )
    }),
  emitterCompanyMail: yup
    .string()
    .nullable()
    .email()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("L'adresse email de l'entreprise émettrice est requis")
    }),
  wasteCode: yup
    .string()
    .nullable()
    .oneOf(
      [null, ...WASTE_CODES],
      "Le code déchet ne fait pas partie de la liste reconnue : ${values}"
    )
    .when("isDraft", {
      is: true,
      otherwise: schema => schema.required("Le code déchet est requis")
    }),
  wasteAdr: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema => schema.required("La mention ADR est requise")
    }),
  weightValue: yup
    .number()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le poids total du déchet est requis")
    }),
  destinationPlannedOperationCode: yup
    .string()
    .nullable()
    .oneOf(
      [null, ...Object.keys(OPERATION)],
      "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${values}"
    )
});

export async function validateBsff(
  bsff: SetOptional<
    Pick<Bsff, "id" | "type" | "emitterCompanySiret">,
    "emitterCompanySiret"
  >,
  previousBsffs: Bsff[],
  ficheInterventions: BsffFicheIntervention[]
) {
  await bsffSchema.validate(bsff, {
    abortEarly: false
  });
  await validatePreviousBsffs(bsff, previousBsffs);
  await validateFicheInterventions(bsff, ficheInterventions);
}

async function validatePreviousBsffs(
  bsff: SetOptional<
    Pick<Bsff, "id" | "type" | "emitterCompanySiret">,
    "emitterCompanySiret"
  >,
  previousBsffs: Bsff[]
) {
  if (previousBsffs.length === 0) {
    return;
  }

  const previousBsffsWithDestination = previousBsffs.filter(
    previousBsff => previousBsff.destinationCompanySiret
  );

  if (
    bsff.emitterCompanySiret &&
    previousBsffsWithDestination.some(
      previousBsff =>
        previousBsff.destinationCompanySiret !== bsff.emitterCompanySiret
    )
  ) {
    throw new UserInputError(
      `Certains des bordereaux à associer ne sont pas en la possession du nouvel émetteur.`
    );
  }

  const firstPreviousBsffWithDestination = previousBsffsWithDestination[0];
  if (
    previousBsffsWithDestination.some(
      previousBsff =>
        previousBsff.destinationCompanySiret !==
        firstPreviousBsffWithDestination.destinationCompanySiret
    )
  ) {
    throw new UserInputError(
      `Certains des bordereaux à associer ne sont pas en possession du même établissement.`
    );
  }

  const fullPreviousBsffs = await prisma.bsff.findMany({
    where: { id: { in: previousBsffs.map(bsff => bsff.id) } },
    include: {
      forwardedIn: true,
      repackagedIn: true,
      groupedIn: true
    }
  });

  const errors = fullPreviousBsffs.reduce<string[]>((acc, previousBsff) => {
    if (previousBsff.status === BsffStatus.PROCESSED) {
      return acc.concat([
        `Le bordereau n°${previousBsff.id} a déjà reçu son traitement final.`
      ]);
    }

    if (previousBsff.status !== BsffStatus.INTERMEDIATELY_PROCESSED) {
      return acc.concat([
        `Le bordereau n°${previousBsff.id} n'a pas toutes les signatures requises.`
      ]);
    }

    const { forwardedIn, repackagedIn, groupedIn } = previousBsff;
    // nextBsffs of previous
    const nextBsffs = [
      ...(forwardedIn ? [forwardedIn] : []),
      ...(repackagedIn ? [repackagedIn] : []),
      ...(groupedIn ? [groupedIn] : [])
    ];
    if (
      nextBsffs.length > 0 &&
      !nextBsffs.map(bsff => bsff.id).includes(bsff.id)
    ) {
      return acc.concat([
        `Le bordereau n°${previousBsff.id} a déjà été réexpédié, reconditionné ou groupé.`
      ]);
    }

    const operation =
      OPERATION[previousBsff.destinationOperationCode as BsffOperationCode];
    if (!operation.successors.includes(bsff.type)) {
      return acc.concat([
        `Le bordereau n°${previousBsff.id} a déclaré un traitement qui ne permet pas de lui donner la suite voulue.`
      ]);
    }

    return acc;
  }, []);

  if (errors.length > 0) {
    throw new UserInputError(errors.join("\n"));
  }
}

async function validateFicheInterventions(
  bsff: Pick<Bsff, "id" | "type">,
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

  const errors = ficheInterventions.reduce<string[]>(
    (acc, ficheIntervention) => {
      if (ficheIntervention.bsffId && ficheIntervention.bsffId !== bsff.id) {
        return acc.concat([
          `La fiche d'intervention n°${ficheIntervention.numero} est déjà associé à un BSFF.`
        ]);
      }

      return acc;
    },
    []
  );

  if (errors.length > 0) {
    throw new UserInputError(errors.join("\n"));
  }
}

const beforeEmissionSchema: yup.SchemaOf<Pick<
  Bsff,
  "isDraft" | "emitterEmissionSignatureDate"
>> = yup.object({
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
});

export function validateBeforeEmission(
  bsff: typeof beforeEmissionSchema["__outputType"]
) {
  return beforeEmissionSchema.validate(bsff, {
    abortEarly: false
  });
}

const beforeTransportSchema: yup.SchemaOf<Pick<
  Bsff,
  | "packagings"
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "emitterEmissionSignatureDate"
  | "transporterTransportSignatureDate"
  | "transporterTransportMode"
>> = yup.object({
  packagings: yup
    .array()
    .nullable()
    .of<yup.SchemaOf<Omit<BsffPackaging, "__typename">>>(
      yup.object({
        name: yup
          .string()
          .nullable()
          .required("La dénomination du contenant est requise"),
        volume: yup.number().nullable(),
        numero: yup
          .string()
          .nullable()
          .required("Le numéro identifiant du contenant est requis"),
        weight: yup
          .number()
          .nullable()
          .required("Le poids du contenant est requis")
      })
    )
    .required("Le conditionnement est requis"),
  transporterCompanyName: yup
    .string()
    .nullable()
    .required("Le nom du transporteur est requis"),
  transporterCompanySiret: yup
    .string()
    .nullable()
    .length(
      14,
      "Le SIRET du transporteur n'est pas au bon format (${length} caractères)"
    )
    .required("Le SIRET du transporteur est requis"),
  transporterCompanyAddress: yup
    .string()
    .nullable()
    .required("L'adresse du transporteur est requise"),
  transporterCompanyContact: yup
    .string()
    .nullable()
    .required("Le nom du contact dans l'entreprise émettrice est requis"),
  transporterCompanyPhone: yup
    .string()
    .nullable()
    .required("Le numéro de téléphone du transporteur est requis"),
  transporterCompanyMail: yup
    .string()
    .nullable()
    .email()
    .required("L'adresse email du transporteur est requis"),
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
    ) as any, // https://github.com/jquense/yup/issues/1302
  transporterTransportMode: yup
    .mixed<TransportMode>()
    .nullable()
    .oneOf(
      [null, ...Object.values(TransportMode)],
      "Le mode de transport ne fait pas partie de la liste reconnue : ${values}"
    )
    .required("Le mode de transport utilisé par le transporteur est requis")
});

export function validateBeforeTransport(
  bsff: typeof beforeTransportSchema["__outputType"]
) {
  return beforeTransportSchema.validate(bsff, {
    abortEarly: false
  });
}

export const beforeReceptionSchema: yup.SchemaOf<Pick<
  Bsff,
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
  | "transporterTransportSignatureDate"
  | "destinationReceptionSignatureDate"
  | "destinationReceptionDate"
  | "destinationReceptionWeight"
>> = yup.object({
  destinationCompanyName: yup
    .string()
    .nullable()
    .required("Le nom de l'installation de destination est requis"),
  destinationCompanySiret: yup
    .string()
    .nullable()
    .length(
      14,
      "Le SIRET de l'installation de destination n'est pas au bon format (${length} caractères)"
    )
    .required("Le SIRET de l'installation de destination est requis"),
  destinationCompanyAddress: yup
    .string()
    .nullable()
    .required("L'adresse de l'installation de destination est requise"),
  destinationCompanyContact: yup
    .string()
    .nullable()
    .required("Le nom du contact dans l'entreprise émettrice est requis"),
  destinationCompanyPhone: yup
    .string()
    .nullable()
    .required(
      "Le numéro de téléphone de l'installation de destination est requis"
    ),
  destinationCompanyMail: yup
    .string()
    .nullable()
    .email()
    .required("L'adresse email de l'installation de destination est requis"),
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
    ) as any, // https://github.com/jquense/yup/issues/1302
  destinationReceptionDate: yup
    .date()
    .nullable()
    .required("La date de réception du déchet est requise") as any, // https://github.com/jquense/yup/issues/1302
  destinationReceptionAcceptationStatus: yup
    .mixed<WasteAcceptationStatus>()
    .required()
    .notOneOf(
      [WasteAcceptationStatus.PARTIALLY_REFUSED],
      "Le refus partiel n'est pas autorisé dans le cas d'un BSFF"
    ),
  destinationReceptionRefusalReason: yup
    .string()
    .when(
      "destinationReceptionAcceptationStatus",
      (acceptationStatus, schema) =>
        acceptationStatus === WasteAcceptationStatus.REFUSED
          ? schema.ensure().required("Vous devez saisir un motif de refus")
          : schema
              .ensure()
              .max(
                0,
                "Le motif du refus ne doit pas être renseigné si le déchet est accepté"
              )
    ),
  destinationReceptionWeight: yup
    .number()
    .nullable()
    .required("Le poids en kilos du déchet reçu est requis")
    .when("destinationReceptionAcceptationStatus", {
      is: value => value === WasteAcceptationStatus.REFUSED,
      then: schema =>
        schema.oneOf(
          [0],
          "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
        ),
      otherwise: schema =>
        schema.positive("Vous devez saisir une quantité reçue supérieure à 0")
    })
});

export function validateBeforeReception(
  bsff: typeof beforeReceptionSchema["__outputType"]
) {
  return beforeReceptionSchema.validate(bsff, {
    abortEarly: false
  });
}

const beforeOperationSchema: yup.SchemaOf<Pick<
  Bsff,
  | "destinationReceptionSignatureDate"
  | "destinationOperationSignatureDate"
  | "destinationOperationCode"
>> = yup.object({
  destinationReceptionSignatureDate: yup
    .date()
    .nullable()
    .required(
      "L'installation de destination ne peut pas signer le traitement avant la réception du déchet"
    ) as any, // https://github.com/jquense/yup/issues/1302
  destinationOperationSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "L'installation de destination a déjà signé le traitement du déchet",
      value => value == null
    ) as any, // https://github.com/jquense/yup/issues/1302
  destinationOperationCode: yup
    .string()
    .oneOf(
      Object.keys(OPERATION),
      "Le code de l'opération de traitement ne fait pas partie de la liste reconnue : ${values}"
    )
});

export function validateBeforeOperation(
  bsff: typeof beforeOperationSchema["__outputType"]
) {
  return beforeOperationSchema.validate(bsff, {
    abortEarly: false
  });
}

const ficheInterventionSchema: yup.SchemaOf<Pick<
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
>> = yup.object({
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
    .length(
      14,
      "Le SIRET de l'entreprise détentrice de l'équipement n'est pas au bon format (${length} caractères)"
    ),
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
    .length(
      14,
      "Le SIRET de l'entreprise de l'opérateur n'est pas au bon format (${length} caractères)"
    ),
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
