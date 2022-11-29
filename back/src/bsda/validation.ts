import {
  Bsda,
  BsdaStatus,
  BsdaType,
  CompanyVerificationStatus,
  Prisma,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import * as yup from "yup";
import { BSDA_WASTE_CODES } from "../common/constants";
import {
  isSiret,
  isForeignVat,
} from "../common/constants/companySearchHelpers";
import configureYup, { FactorySchemaOf } from "../common/yup/configureYup";
import { validateCompany } from "../companies/validateCompany";
import {
  isCollector,
  isTransporter,
  isWasteCenter,
  isWasteProcessor
} from "../companies/validation";
import {
  INVALID_SIRET_LENGTH,
  INVALID_WASTE_CODE,
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_EMAIL,
  MISSING_COMPANY_NAME,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_SIRET
} from "../forms/errors";
import { intermediarySchema } from "../forms/validation";
import { BsdaConsistence, CompanyInput } from "../generated/graphql/types";
import prisma from "../prisma";

configureYup();

const { VERIFY_COMPANY } = process.env;
export const PARTIAL_OPERATIONS = ["R 13", "D 15"];
export const OPERATIONS = ["R 5", "D 5", "D 9", ...PARTIAL_OPERATIONS];
type Emitter = Pick<
  Bsda,
  | "emitterIsPrivateIndividual"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
  | "emitterPickupSiteName"
  | "emitterPickupSiteAddress"
  | "emitterPickupSiteCity"
  | "emitterPickupSitePostalCode"
  | "emitterPickupSiteInfos"
>;

type Worker = Pick<
  Bsda,
  | "workerCompanyName"
  | "workerCompanySiret"
  | "workerCompanyAddress"
  | "workerCompanyContact"
  | "workerCompanyPhone"
  | "workerCompanyMail"
  | "workerWorkHasEmitterPaperSignature"
  | "workerCertificationHasSubSectionFour"
  | "workerCertificationHasSubSectionThree"
  | "workerCertificationCertificationNumber"
  | "workerCertificationValidityLimit"
  | "workerCertificationOrganisation"
>;

type Destination = Pick<
  Bsda,
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
  | "destinationCap"
  | "destinationPlannedOperationCode"
  | "destinationReceptionDate"
  | "destinationReceptionWeight"
  | "destinationReceptionAcceptationStatus"
  | "destinationReceptionRefusalReason"
  | "destinationOperationCode"
  | "destinationOperationDescription"
  | "destinationOperationDate"
  | "destinationOperationNextDestinationCap"
>;

type Transporter = Pick<
  Bsda,
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterCompanyVatNumber"
  | "transporterRecepisseIsExempted"
  | "transporterRecepisseNumber"
  | "transporterRecepisseDepartment"
  | "transporterRecepisseValidityLimit"
  | "transporterTransportMode"
  | "transporterTransportPlates"
>;

type WasteDescription = Pick<
  Bsda,
  | "wasteCode"
  | "wasteFamilyCode"
  | "wasteMaterialName"
  | "wasteConsistence"
  | "wasteSealNumbers"
  | "wasteAdr"
  | "wastePop"
  | "packagings"
  | "weightIsEstimate"
  | "weightValue"
>;

interface BsdaValidationContext {
  skipPreviousBsdas?: boolean;
  emissionSignature?: boolean;
  transportSignature?: boolean;
  operationSignature?: boolean;
  workSignature?: boolean;
}

export async function validateBsda(
  bsda: Omit<Partial<Prisma.BsdaCreateInput>, "intermediaries">,
  {
    previousBsdas,
    intermediaries
  }: {
    previousBsdas: Bsda[];
    intermediaries: CompanyInput[];
  },
  context: BsdaValidationContext
) {
  await emitterSchema(context)
    .concat(workerSchema(context))
    .concat(destinationSchema(context))
    .concat(transporterSchema(context))
    .concat(wasteDescriptionSchema(context))
    .validate(bsda, { abortEarly: false });

  if (!context.skipPreviousBsdas) {
    await validatePreviousBsdas(bsda, previousBsdas);
  }
  await validateIntermediaries(intermediaries);
}

async function validateIntermediaries(
  intermediaries: CompanyInput[] | undefined
) {
  if (!intermediaries || intermediaries.length === 0) {
    return;
  }

  if (intermediaries.length > 3) {
    throw new UserInputError(
      "Intermédiaires: impossible d'ajouter plus de 3 intermédiaires sur un BSDA"
    );
  }

  const intermediaryIdentifiers = intermediaries.map(
    c => c.siret || c.vatNumber
  );
  const hasDuplicate =
    new Set(intermediaryIdentifiers).size !== intermediaryIdentifiers.length;
  if (hasDuplicate) {
    throw new UserInputError(
      "Intermédiaires: impossible d'ajouter le même établissement en intermédiaire plusieurs fois"
    );
  }

  for (const intermediary of intermediaries) {
    await intermediarySchema.validate(intermediary);
    await validateCompany(intermediary);
  }
}

async function validatePreviousBsdas(
  bsda: Partial<Prisma.BsdaCreateInput>,
  previousBsdas: Bsda[]
) {
  if (!["GATHERING", "RESHIPMENT"].includes(bsda.type)) {
    return;
  }

  if (previousBsdas.length === 0) {
    throw new UserInputError(
      `Un bordereau de groupement ou de réexpédition doit obligatoirement être associé à au moins un bordereau.`
    );
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
    throw new UserInputError(
      `Certains des bordereaux à associer ne sont pas en la possession du nouvel émetteur.`
    );
  }

  const nextDestinations = previousBsdas.map(
    bsda => bsda.destinationOperationNextDestinationCompanySiret
  );
  if (!nextDestinations.every(siret => siret === nextDestinations[0])) {
    throw new UserInputError(
      `Certains des bordereaux à associer ont des exutoires différents. Ils ne peuvent pas être groupés ensemble.`
    );
  }

  const firstPreviousBsdaWithDestination = previousBsdasWithDestination[0];
  if (
    previousBsdasWithDestination.some(
      previousBsda =>
        previousBsda.destinationCompanySiret !==
        firstPreviousBsdaWithDestination.destinationCompanySiret
    )
  ) {
    throw new UserInputError(
      `Certains des bordereaux à associer ne sont pas en possession du même établissement.`
    );
  }

  const fullpreviousBsdas = await prisma.bsda.findMany({
    where: { id: { in: previousBsdas.map(bsda => bsda.id) } },
    include: {
      forwardedIn: true,
      groupedIn: true
    }
  });

  const errors = fullpreviousBsdas.reduce<string[]>((acc, previousBsda) => {
    if (previousBsda.status === BsdaStatus.PROCESSED) {
      return acc.concat([
        `Le bordereau n°${previousBsda.id} a déjà reçu son traitement final.`
      ]);
    }

    if (previousBsda.status !== BsdaStatus.AWAITING_CHILD) {
      return acc.concat([
        `Le bordereau n°${previousBsda.id} n'a pas toutes les signatures requises.`
      ]);
    }

    const { forwardedIn, groupedIn } = previousBsda;
    // nextBsdas of previous
    const nextBsdas = [forwardedIn, groupedIn].filter(Boolean);
    if (
      nextBsdas.length > 0 &&
      !nextBsdas.map(bsda => bsda.id).includes(bsda.id)
    ) {
      return acc.concat([
        `Le bordereau n°${previousBsda.id} a déjà été réexpédié ou groupé.`
      ]);
    }

    if (!PARTIAL_OPERATIONS.includes(previousBsda.destinationOperationCode)) {
      return acc.concat([
        `Le bordereau n°${previousBsda.id} a déclaré un traitement qui ne permet pas de lui donner la suite voulue.`
      ]);
    }

    return acc;
  }, []);

  if (errors.length > 0) {
    throw new UserInputError(errors.join("\n"));
  }
}

const emitterSchema: FactorySchemaOf<BsdaValidationContext, Emitter> =
  context =>
    yup.object({
      emitterIsPrivateIndividual: yup
        .boolean()
        .requiredIf(
          context.emissionSignature,
          `Émetteur: vous devez précisez si c'est un particulier ou un professionnel`
        ),
      emitterCompanyName: yup
        .string()
        .requiredIf(
          context.emissionSignature,
          `Émetteur: ${MISSING_COMPANY_NAME}`
        ),
      emitterCompanySiret: yup.string().when("emitterIsPrivateIndividual", {
        is: true,
        then: yup
          .string()
          .oneOf(
            [null, ""],
            "Émetteur: Le champ SIRET ne doit pas avoir de valeur dans le cas d'un particulier"
          )
          .nullable(true),
        otherwise: yup
          .string()
          .length(14, `Émetteur: ${INVALID_SIRET_LENGTH}`)
          .requiredIf(
            context.emissionSignature,
            `Émetteur: ${MISSING_COMPANY_SIRET}`
          )
      }),
      emitterCompanyAddress: yup
        .string()
        .requiredIf(
          context.emissionSignature,
          `Émetteur: ${MISSING_COMPANY_ADDRESS}`
        ),
      emitterCompanyContact: yup.string().when("emitterIsPrivateIndividual", {
        is: true,
        then: yup.string().nullable(true),
        otherwise: yup
          .string()
          .requiredIf(
            context.emissionSignature,
            `Émetteur: ${MISSING_COMPANY_CONTACT}`
          )
      }),
      emitterCompanyPhone: yup.string().when("emitterIsPrivateIndividual", {
        is: true,
        then: schema => schema.nullable().notRequired(),
        otherwise: schema =>
          schema.requiredIf(
            context.emissionSignature,
            `Émetteur: ${MISSING_COMPANY_PHONE}`
          )
      }),
      emitterCompanyMail: yup
        .string()
        .email()
        .when("emitterIsPrivateIndividual", {
          is: true,
          then: schema => schema.nullable().notRequired(),
          otherwise: schema =>
            schema.requiredIf(
              context.emissionSignature,
              `Émetteur: ${MISSING_COMPANY_EMAIL}`
            )
        }),
      emitterPickupSiteAddress: yup.string().nullable(),
      emitterPickupSiteCity: yup.string().nullable(),
      emitterPickupSiteInfos: yup.string().nullable(),
      emitterPickupSiteName: yup.string().nullable(),
      emitterPickupSitePostalCode: yup.string().nullable()
    });

const workerSchema: FactorySchemaOf<BsdaValidationContext, Worker> = context =>
  yup.object({
    workerIsDisabled: yup.boolean().nullable(),
    workerCompanyName: yup.string().when(["type", "workerIsDisabled"], {
      is: (type, isDisabled) =>
        [
          BsdaType.RESHIPMENT,
          BsdaType.GATHERING,
          BsdaType.COLLECTION_2710
        ].includes(type) || isDisabled,
      then: schema =>
        schema
          .nullable()
          .max(
            0,
            "Impossible de saisir le nom d'une entreprise de travaux pour ce type de bordereau"
          ),
      otherwise: schema =>
        schema.requiredIf(
          context.emissionSignature,
          `Entreprise de travaux: ${MISSING_COMPANY_NAME}`
        )
    }),
    workerCompanySiret: yup.string().when(["type", "workerIsDisabled"], {
      is: (type, isDisabled) =>
        [
          BsdaType.RESHIPMENT,
          BsdaType.GATHERING,
          BsdaType.COLLECTION_2710
        ].includes(type) || isDisabled,
      then: schema =>
        schema
          .nullable()
          .max(
            0,
            "Impossible de saisir le SIRET d'une entreprise de travaux pour ce type de bordereau"
          ),
      otherwise: schema =>
        schema
          .length(14, `Entreprise de travaux: ${INVALID_SIRET_LENGTH}`)
          .requiredIf(
            context.emissionSignature,
            `Entreprise de travaux: ${MISSING_COMPANY_SIRET}`
          )
    }),
    workerCompanyAddress: yup.string().when(["type", "workerIsDisabled"], {
      is: (type, isDisabled) =>
        [
          BsdaType.RESHIPMENT,
          BsdaType.GATHERING,
          BsdaType.COLLECTION_2710
        ].includes(type) || isDisabled,
      then: schema => schema.nullable(),
      otherwise: schema =>
        schema.requiredIf(
          context.emissionSignature,
          `Entreprise de travaux: ${MISSING_COMPANY_ADDRESS}`
        )
    }),
    workerCompanyContact: yup.string().when(["type", "workerIsDisabled"], {
      is: (type, isDisabled) =>
        [
          BsdaType.RESHIPMENT,
          BsdaType.GATHERING,
          BsdaType.COLLECTION_2710
        ].includes(type) || isDisabled,
      then: schema => schema.nullable(),
      otherwise: schema =>
        schema.requiredIf(
          context.emissionSignature,
          `Entreprise de travaux: ${MISSING_COMPANY_CONTACT}`
        )
    }),
    workerCompanyPhone: yup.string().when(["type", "workerIsDisabled"], {
      is: (type, isDisabled) =>
        [
          BsdaType.RESHIPMENT,
          BsdaType.GATHERING,
          BsdaType.COLLECTION_2710
        ].includes(type) || isDisabled,
      then: schema => schema.nullable(),
      otherwise: schema =>
        schema.requiredIf(
          context.emissionSignature,
          `Entreprise de travaux: ${MISSING_COMPANY_PHONE}`
        )
    }),
    workerCompanyMail: yup
      .string()
      .email()
      .when(["type", "workerIsDisabled"], {
        is: (type, isDisabled) =>
          [
            BsdaType.RESHIPMENT,
            BsdaType.GATHERING,
            BsdaType.COLLECTION_2710
          ].includes(type) || isDisabled,
        then: schema => schema.nullable(),
        otherwise: schema =>
          schema.requiredIf(
            context.emissionSignature,
            `Entreprise de travaux: ${MISSING_COMPANY_EMAIL}`
          )
      }),
    workerWorkHasEmitterPaperSignature: yup.boolean().nullable(),
    workerCertificationHasSubSectionFour: yup.boolean().nullable(),
    workerCertificationHasSubSectionThree: yup.boolean().nullable(),
    workerCertificationCertificationNumber: yup
      .string()
      .when("hasSubSectionThree", {
        is: true,
        then: schema => schema.required(),
        otherwise: schema => schema.nullable()
      }),
    workerCertificationValidityLimit: yup.date().when("hasSubSectionThree", {
      is: true,
      then: schema => schema.required(),
      otherwise: schema => schema.nullable()
    }),
    workerCertificationOrganisation: yup
      .string()
      .oneOf([
        "AFNOR Certification",
        "GLOBAL CERTIFICATION",
        "QUALIBAT",
        "",
        null
      ])
      .when("hasSubSectionThree", {
        is: true,
        then: schema => schema.required(),
        otherwise: schema => schema.nullable()
      })
  });

const destinationSchema: FactorySchemaOf<BsdaValidationContext, Destination> =
  context =>
    yup.object({
      destinationCompanyName: yup
        .string()
        .requiredIf(
          context.emissionSignature,
          `Entreprise de destination: ${MISSING_COMPANY_NAME}`
        ),
      destinationCompanySiret: yup
        .string()
        .length(14, `Entreprise de destination: ${INVALID_SIRET_LENGTH}`)
        .requiredIf(
          context.emissionSignature,
          `Entreprise de destination: ${MISSING_COMPANY_SIRET}`
        )
        .test(
          "is-recipient-registered-with-right-profile",
          ({ value }) =>
            `L'installation de destination avec le SIRET ${value} n'est pas inscrite sur Trackdéchets`,
          async (siret, ctx) => {
            if (!siret) return true;

            const company = await prisma.company.findUnique({
              where: { siret }
            });
            if (!company) {
              return false;
            }

            if (
              !isCollector(company) &&
              !isWasteProcessor(company) &&
              !isWasteCenter(company)
            ) {
              throw ctx.createError({
                message: `L'installation de destination ou d'entreposage ou de reconditionnement avec le SIRET ${siret} n'est pas inscrite sur Trackdéchets en tant qu'installation de traitement, de tri transit regroupement ou déchetterie. Cette installation ne peut donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements.`
              });
            }

            if (
              VERIFY_COMPANY === "true" &&
              company.verificationStatus !== CompanyVerificationStatus.VERIFIED
            ) {
              throw ctx.createError({
                message: `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau bordereau.`
              });
            }

            return true;
          }
        ),
      destinationCompanyAddress: yup
        .string()
        .requiredIf(
          context.emissionSignature,
          `Entreprise de destination: ${MISSING_COMPANY_ADDRESS}`
        ),
      destinationCompanyContact: yup
        .string()
        .requiredIf(
          context.emissionSignature,
          `Entreprise de destination: ${MISSING_COMPANY_CONTACT}`
        ),
      destinationCompanyPhone: yup
        .string()
        .requiredIf(
          context.emissionSignature,
          `Entreprise de destination: ${MISSING_COMPANY_PHONE}`
        ),
      destinationCompanyMail: yup
        .string()
        .email()
        .requiredIf(
          context.emissionSignature,
          `Entreprise de destination: ${MISSING_COMPANY_EMAIL}`
        ),
      destinationCap: yup.string().when("type", {
        is: value =>
          [
            BsdaType.COLLECTION_2710,
            BsdaType.GATHERING,
            BsdaType.RESHIPMENT
          ].includes(value),
        then: schema => schema.nullable(),
        otherwise: s =>
          s.when("destinationPlannedOperationCode", {
            is: value => PARTIAL_OPERATIONS.includes(value),
            then: schema => schema.nullable(),
            otherwise: schema =>
              schema.requiredIf(
                context.emissionSignature,
                `Entreprise de destination: CAP obligatoire`
              )
          })
      }),
      destinationPlannedOperationCode: yup
        .string()
        .requiredIf(
          context.emissionSignature,
          `Entreprise de destination: vous devez préciser le code d'opération prévu`
        )
        .oneOf(
          [null, "", ...OPERATIONS],
          "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${values}"
        ),
      destinationReceptionDate: yup
        .date()
        .max(new Date())
        .requiredIf(
          context.operationSignature,
          `Entreprise de destination:vous devez préciser la date de réception`
        ) as any,
      destinationReceptionWeight: yup
        .number()
        .when("destinationReceptionAcceptationStatus", {
          is: value => value === WasteAcceptationStatus.REFUSED,
          then: schema =>
            schema
              .oneOf(
                [0, null],
                "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
              )
              .nullable(),
          otherwise: schema =>
            schema
              .positive("Vous devez saisir une quantité reçue supérieure à 0")
              .requiredIf(
                context.operationSignature,
                `Entreprise de destination: vous devez préciser la quantité`
              )
        }),
      destinationReceptionAcceptationStatus: yup
        .mixed<WasteAcceptationStatus>()
        .requiredIf(
          context.operationSignature,
          `Entreprise de destination: vous devez préciser le statut d'acceptation`
        ),
      destinationReceptionRefusalReason: yup
        .string()
        .when(
          "destinationReceptionAcceptationStatus",
          (acceptationStatus, schema) =>
            [
              WasteAcceptationStatus.REFUSED,
              WasteAcceptationStatus.PARTIALLY_REFUSED
            ].includes(acceptationStatus)
              ? schema.ensure().required("Vous devez saisir un motif de refus")
              : schema
                  .ensure()
                  .max(
                    0,
                    "Le motif du refus ne doit pas être renseigné si le déchet est accepté"
                  )
        ),
      destinationOperationCode: yup
        .string()
        .when("destinationReceptionAcceptationStatus", {
          is: value => value === WasteAcceptationStatus.REFUSED,
          then: schema =>
            schema
              .oneOf(
                [null, ""],
                "Le code d'opération ne doit pas être renseigné lorsque le déchet est refusé"
              )
              .nullable(),
          otherwise: schema =>
            schema
              .oneOf(
                [null, "", ...OPERATIONS],
                "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${values}"
              )
              .requiredIf(
                context.operationSignature,
                `Entreprise de destination: vous devez préciser le code d'opération réalisé`
              )
        }),
      destinationOperationDescription: yup.string().nullable(),
      destinationOperationDate: yup
        .date()
        .when("destinationReceptionAcceptationStatus", {
          is: value => value === WasteAcceptationStatus.REFUSED,
          then: schema => schema.nullable(),
          otherwise: schema =>
            schema
              .max(
                new Date(),
                "La date d'opération doit être antérieure au moment présent"
              )
              .when(
                "destinationReceptionDate",
                (destinationReceptionDate, schema) =>
                  destinationReceptionDate
                    ? schema.min(
                        destinationReceptionDate,
                        "La date d'opération doit être postérieure à la date de réception"
                      )
                    : schema
              )
              .requiredIf(
                context.operationSignature,
                `Entreprise de destination: vous devez préciser la date d'opération`
              ) as any
        }),
      destinationOperationNextDestinationCap: yup
        .string()
        .when("destinationOperationNextDestinationCompanySiret", {
          is: value => Boolean(value),
          then: schema =>
            schema.requiredIf(
              context.emissionSignature,
              `Entreprise de destination ultérieure prévue: CAP obligatoire`
            ),
          otherwise: schema => schema.nullable()
        })
    });

const transporterSchema: FactorySchemaOf<BsdaValidationContext, Transporter> =
  context =>
    yup.object({
      transporterRecepisseIsExempted: yup.boolean().nullable(),
      transporterRecepisseDepartment: yup
        .string()
        .when(
          [
            "type",
            "transporterRecepisseIsExempted",
            "transporterCompanyVatNumber",
            "transporterCompanyAddress"
          ],
          {
            is: (type, isExempted, vat, address) =>
              type === BsdaType.COLLECTION_2710 ||
              isExempted ||
              isForeignVat(vat, address),
            then: schema => schema.nullable().notRequired(),
            otherwise: schema =>
              schema.requiredIf(
                context.transportSignature,
                `Transporteur: le département associé au récépissé est obligatoire`
              )
          }
        ),
      transporterRecepisseNumber: yup
        .string()
        .when(
          [
            "type",
            "transporterRecepisseIsExempted",
            "transporterCompanyVatNumber",
            "transporterCompanyAddress"
          ],
          {
            is: (type, isExempted, vat, address) =>
              type === BsdaType.COLLECTION_2710 ||
              isExempted ||
              isForeignVat(vat, address),
            then: schema => schema.nullable().notRequired(),
            otherwise: schema =>
              schema.requiredIf(
                context.transportSignature,
                `Transporteur: le numéro de récépissé est obligatoire`
              )
          }
        ),
      transporterRecepisseValidityLimit: yup
        .date()
        .when(
          [
            "type",
            "transporterRecepisseIsExempted",
            "transporterCompanyVatNumber",
            "transporterCompanyAddress"
          ],
          {
            is: (type, isExempted, vat, address) =>
              type === BsdaType.COLLECTION_2710 ||
              isExempted ||
              isForeignVat(vat, address),
            then: schema => schema.nullable().notRequired(),
            otherwise: schema =>
              schema.requiredIf(
                context.transportSignature,
                `Transporteur: la date limite de validité du récépissé est obligatoire`
              )
          }
        ),
      transporterCompanyName: yup.string().when("type", {
        is: BsdaType.COLLECTION_2710,
        then: schema =>
          schema
            .nullable()
            .max(
              0,
              "Impossible de saisir un transporteur pour ce type de bordereau"
            ),
        otherwise: schema =>
          schema.requiredIf(
            context.transportSignature,
            `Transporteur: ${MISSING_COMPANY_NAME}`
          )
      }),
      transporterCompanySiret: yup
        .string()
        .ensure()
        .when("type", {
          is: BsdaType.COLLECTION_2710,
          then: schema =>
            schema
              .nullable()
              .max(
                0,
                "Impossible de saisir le SIRET d'un transporteur pour ce type de bordereau"
              ),
          otherwise: schema =>
            schema.when("transporterCompanyVatNumber", (tva, schema) => {
              if (!tva && context.transportSignature) {
                return schema.test(
                  "is-siret",
                  "${path} n'est pas un numéro de SIRET valide",
                  value => isSiret(value)
                );
              }
              return schema
                .nullable()
                .requiredIf(
                  context.workSignature,
                  `Transporteur: ${MISSING_COMPANY_SIRET}`
                );
            })
        })
        .test(
          "is-transporter-registered-with-right-profile",
          ({ value }) =>
            `Le transporteur avec le SIRET ${value} n'est pas inscrit sur Trackdéchets`,
          async (siret, ctx) => {
            if (!siret) return true;

            const company = await prisma.company.findUnique({
              where: { siret }
            });
            if (!company) {
              return false;
            }

            if (!isTransporter(company)) {
              throw ctx.createError({
                message: `Le transporteur avec le SIRET ${siret} n'est pas inscrit sur Trackdéchets en tant qu'entreprise de transport. Cet établissement ne peut donc pas être visé sur le bordereau. Veuillez vous rapprocher de l'administrateur de cet établissement pour qu'il modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements.`
              });
            }

            return true;
          }
        ),
      transporterCompanyVatNumber: yup
        .string()
        .ensure()
        .test(
          "is-vat",
          [
            "{path} n'est pas un numéro de TVA intracommunautaire valide.",
            "Seuls les numéros non-français sont valides, les entreprises françaises doivent être identifiées par leur numéro de SIRET"
          ].join(" "),
          (value, context) =>
            !value ||
            isForeignVat(value, context.parent.transporterCompanyAddress)
        ),
      transporterCompanyAddress: yup.string().when("type", {
        is: BsdaType.COLLECTION_2710,
        then: schema => schema.nullable(),
        otherwise: schema =>
          schema.requiredIf(
            context.transportSignature,
            `Transporteur: ${MISSING_COMPANY_ADDRESS}`
          )
      }),
      transporterCompanyContact: yup.string().when("type", {
        is: BsdaType.COLLECTION_2710,
        then: schema => schema.nullable(),
        otherwise: schema =>
          schema.requiredIf(
            context.transportSignature,
            `Transporteur: ${MISSING_COMPANY_CONTACT}`
          )
      }),
      transporterCompanyPhone: yup.string().when("type", {
        is: BsdaType.COLLECTION_2710,
        then: schema => schema.nullable(),
        otherwise: schema =>
          schema.requiredIf(
            context.transportSignature,
            `Transporteur: ${MISSING_COMPANY_PHONE}`
          )
      }),
      transporterCompanyMail: yup
        .string()
        .email()
        .when("type", {
          is: BsdaType.COLLECTION_2710,
          then: schema => schema.nullable(),
          otherwise: schema =>
            schema.requiredIf(
              context.transportSignature,
              `Transporteur: ${MISSING_COMPANY_EMAIL}`
            )
        }),
      transporterTransportMode: yup
        .mixed<TransportMode>()
        .nullable()
        .oneOf(
          [null, ...Object.values(TransportMode)],
          "Le mode de transport ne fait pas partie de la liste reconnue : ${values}"
        )
        .requiredIf(
          context.transportSignature,
          "Le mode de transport utilisé par le transporteur est requis"
        ),
      transporterTransportPlates: yup
        .array()
        .of(yup.string())
        .max(2, "Un maximum de 2 plaques d'immatriculation est accepté")
        .when("transporterTransportMode", {
          is: TransportMode.ROAD,
          then: schema =>
            schema.requiredIf(
              context.transportSignature,
              "L'immatriculation du transporteur doit être saisie'"
            ),
          otherwise: schema => schema.nullable()
        })
    });

const packagingsSchema = yup.object({
  type: yup.string().required("Le type de conditionnement est obligatoire"),
  other: yup
    .string()
    .label("Détail du conditionnement")
    .when("type", {
      is: "OTHER",
      then: schema =>
        schema.required("Vous devez saisir la description du conditionnement"),
      otherwise: schema => schema.optional().nullable()
    }),
  quantity: yup
    .number()
    .min(
      1,
      "La quantité d'un conditionnement doit être supérieure ou égale à 1"
    )
    .required("La quantité associée à un conditionnement est obligatoire")
});

const wasteDescriptionSchema: FactorySchemaOf<
  BsdaValidationContext,
  WasteDescription
> = context =>
  yup.object({
    wasteCode: yup
      .string()
      .requiredIf(context.emissionSignature, "Le code déchet est obligatoire")
      .oneOf([...BSDA_WASTE_CODES, "", null], INVALID_WASTE_CODE),
    wasteFamilyCode: yup.string().nullable(),
    wasteMaterialName: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        "La description déchet est obligatoire"
      ),
    wasteConsistence: yup
      .mixed<BsdaConsistence>()
      .requiredIf(context.workSignature, `La consistence est obligatoire`),
    wasteSealNumbers: yup.array().ensure().of(yup.string()) as any,
    wasteAdr: yup.string().nullable(),
    wastePop: yup.boolean().nullable(),
    packagings: yup
      .array()
      .of(packagingsSchema)
      .test(
        "has-packaging",
        "Le conditionnement est obligatoire",
        value => !context.workSignature || value?.length > 0
      ),
    weightIsEstimate: yup
      .boolean()
      .requiredIf(context.workSignature, `Le type de quantité est obligatoire`),
    weightValue: yup
      .number()
      .requiredIf(context.workSignature, `La quantité est obligatoire`)
  });
