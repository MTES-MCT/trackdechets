import * as yup from "yup";
import { UserInputError } from "apollo-server-express";
import {
  Bsff,
  TransportMode,
  BsffFicheIntervention,
  BsffStatus,
  BsffType,
  WasteAcceptationStatus,
  Prisma
} from "@prisma/client";
import { BsffOperationCode, BsffPackaging } from "../generated/graphql/types";
import { OPERATION, WASTE_CODES } from "./constants";
import prisma from "../prisma";
import {
  isVat,
  isSiret,
  isFRVat
} from "../common/constants/companySearchHelpers";
import configureYup, { FactorySchemaOf } from "../common/yup/configureYup";

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

type Reception = Pick<
  Prisma.BsffCreateInput,
  | "destinationReceptionDate"
  | "destinationReceptionWeight"
  | "destinationReceptionAcceptationStatus"
  | "destinationReceptionRefusalReason"
>;

type Operation = Pick<
  Prisma.BsffCreateInput,
  | "destinationOperationCode"
  | "destinationOperationNextDestinationCompanyName"
  | "destinationOperationNextDestinationCompanySiret"
  | "destinationOperationNextDestinationCompanyVatNumber"
  | "destinationOperationNextDestinationCompanyAddress"
  | "destinationOperationNextDestinationCompanyContact"
  | "destinationOperationNextDestinationCompanyPhone"
  | "destinationOperationNextDestinationCompanyMail"
>;

const emitterSchemaFn: FactorySchemaOf<boolean, Emitter> = isDraft =>
  yup.object({
    emitterCompanyName: yup
      .string()
      .requiredIf(!isDraft, "Le nom de l'entreprise émettrice est requis"),
    emitterCompanySiret: yup
      .string()
      .requiredIf(!isDraft, "Le SIRET de l'entreprise émettrice est requis")
      .matches(/^$|^\d{14}$/, {
        message:
          "Le SIRET de l'entreprise émettrice n'est pas au bon format (${length} caractères)"
      }),
    emitterCompanyAddress: yup
      .string()
      .requiredIf(!isDraft, "L'adresse de l'entreprise émettrice est requise"),
    emitterCompanyContact: yup
      .string()
      .requiredIf(
        !isDraft,
        "Le nom du contact dans l'entreprise émettrice est requis"
      ),
    emitterCompanyPhone: yup
      .string()
      .requiredIf(
        !isDraft,
        "Le numéro de téléphone de l'entreprise émettrice est requis"
      ),
    emitterCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        !isDraft,
        "L'adresse email de l'entreprise émettrice est requis"
      )
  });

const transporterSchemaFn: FactorySchemaOf<boolean, Transporter> = isDraft =>
  yup.object({
    transporterCompanyName: yup
      .string()
      .requiredIf(!isDraft, "Le nom du transporteur est requis"),
    transporterCompanySiret: yup
      .string()
      .ensure()
      .when("transporterCompanyVatNumber", (tva, schema) => {
        if (!tva && !isDraft) {
          return schema
            .required(
              `Transporteur : "Le n°SIRET ou le numéro de TVA intracommunautaire est obligatoire"`
            )
            .test(
              "is-siret",
              "${path} n'est pas un numéro de SIRET valide",
              value => isSiret(value)
            );
        }
        if (!isDraft && tva && isFRVat(tva)) {
          return schema.required(
            "Transporteur : Le numéro SIRET est obligatoire pour un établissement français"
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterCompanyVatNumber: yup
      .string()
      .ensure()
      .test(
        "is-vat",
        "${path} n'est pas un numéro de TVA intracommunautaire valide",
        value => !value || isVat(value)
      ),
    transporterCompanyAddress: yup
      .string()
      .requiredIf(!isDraft, "L'adresse du transporteur est requise"),
    transporterCompanyContact: yup
      .string()
      .requiredIf(
        !isDraft,
        "Le nom du contact dans l'entreprise émettrice est requis"
      ),
    transporterCompanyPhone: yup
      .string()
      .requiredIf(
        !isDraft,
        "Le numéro de téléphone du transporteur est requis"
      ),
    transporterCompanyMail: yup
      .string()
      .email()
      .requiredIf(!isDraft, "L'adresse email du transporteur est requis"),
    transporterRecepisseNumber: yup.string().nullable(),
    transporterRecepisseDepartment: yup.string().nullable(),
    transporterRecepisseValidityLimit: yup.date().nullable()
  });

const wasteDetailsSchemaFn: FactorySchemaOf<boolean, WasteDetails> = isDraft =>
  yup.object({
    wasteCode: yup
      .string()
      .nullable()
      .oneOf(
        [null, ...WASTE_CODES],
        "Le code déchet ne fait pas partie de la liste reconnue : ${values}"
      )
      .requiredIf(!isDraft, "Le code déchet est requis"),
    wasteDescription: yup
      .string()
      .requiredIf(!isDraft, "La description du fluide est obligatoire"),
    wasteAdr: yup.string().requiredIf(!isDraft, "La mention ADR est requise"),
    weightValue: yup
      .number()
      .requiredIf(!isDraft, "Le poids total du déchet est requis"),
    weightIsEstimate: yup.boolean(),
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
      .requiredIf(!isDraft, "Le conditionnement est requis")
  });

const destinationSchemaFn: FactorySchemaOf<boolean, Destination> = isDraft =>
  yup.object({
    destinationCompanyName: yup
      .string()
      .nullable()
      .requiredIf(
        !isDraft,
        "Le nom de l'installation de destination est requis"
      ),
    destinationCompanySiret: yup
      .string()
      .requiredIf(
        !isDraft,
        "Le SIRET de l'installation de destination est requis"
      )
      .matches(/^$|^\d{14}$/, {
        message:
          "Le SIRET de l'installation de destination n'est pas au bon format (${length} caractères)"
      }),
    destinationCompanyAddress: yup
      .string()
      .requiredIf(
        !isDraft,
        "L'adresse de l'installation de destination est requise"
      ),
    destinationCompanyContact: yup
      .string()
      .requiredIf(
        !isDraft,
        "Le nom du contact sur l'installation de destination est requis"
      ),
    destinationCompanyPhone: yup
      .string()
      .requiredIf(
        !isDraft,
        "Le numéro de téléphone de l'installation de destination est requis"
      ),
    destinationCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        !isDraft,
        "L'adresse email de l'installation de destination est requis"
      ),
    destinationPlannedOperationCode: yup
      .string()
      .nullable()
      .oneOf(
        [null, ...Object.keys(OPERATION)],
        "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${values}"
      )
      .requiredIf(!isDraft)
  });

const transportSchema: yup.SchemaOf<Transport> = yup.object({
  transporterTransportMode: yup
    .mixed<TransportMode>()
    .nullable()
    .oneOf(
      [null, ...Object.values(TransportMode)],
      "Le mode de transport ne fait pas partie de la liste reconnue : ${values}"
    )
    .required("Le mode de transport utilisé par le transporteur est requis"),
  transporterTransportTakenOverAt: yup.date().required()
});

const receptionSchema: yup.SchemaOf<Reception> = yup.object({
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

const operationSchema: yup.SchemaOf<Operation> = yup.object({
  destinationOperationCode: yup
    .string()
    .oneOf(
      Object.keys(OPERATION),
      "Le code de l'opération de traitement ne fait pas partie de la liste reconnue : ${values}"
    ),
  destinationOperationNextDestinationCompanyName: yup.string().nullable(),
  destinationOperationNextDestinationCompanySiret: yup.string().nullable(),
  destinationOperationNextDestinationCompanyVatNumber: yup.string().nullable(),
  destinationOperationNextDestinationCompanyAddress: yup.string().nullable(),
  destinationOperationNextDestinationCompanyContact: yup.string().nullable(),
  destinationOperationNextDestinationCompanyPhone: yup.string().nullable(),
  destinationOperationNextDestinationCompanyMail: yup.string().nullable()
});

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
    packagings?: BsffPackaging[];
  },
  previousBsffs: Bsff[],
  ficheInterventions: BsffFicheIntervention[]
) {
  try {
    const validationSchema = bsff.isDraft ? draftBsffSchema : bsffSchema;
    const validBsff = await validationSchema.validate(bsff, {
      abortEarly: false
    });
    return validBsff;
  } catch (err) {
    if (err.name === "ValidationError") {
      const stringifiedErrors = err.errors?.join("\n");
      throw new UserInputError(
        `Erreur de validation des données. Des champs sont manquants ou mal formatés : \n ${stringifiedErrors}`
      );
    } else {
      throw err;
    }
  }

  await validatePreviousBsffs(bsff, previousBsffs);
  await validateFicheInterventions(bsff, ficheInterventions);
}

async function validatePreviousBsffs(
  bsff: Partial<Bsff | Prisma.BsffCreateInput>,
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
  bsff: Partial<Bsff | Prisma.BsffCreateInput>,
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

const beforeOperationSchema = bsffSchema
  .concat(transportSchema)
  .concat(receptionSchema)
  .concat(operationSchema)
  .concat(
    yup.object({
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
        ) as any // https://github.com/jquense/yup/issues/1302
    })
  );

export function validateBeforeOperation(
  bsff: typeof beforeOperationSchema["__outputType"]
) {
  return beforeOperationSchema.validate(bsff, {
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
