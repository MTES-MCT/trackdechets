import {
  Bsda,
  BsdaStatus,
  Prisma,
  WasteAcceptationStatus
} from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import * as yup from "yup";
import { WASTES_CODES } from "../common/constants";
import { FactorySchemaOf } from "../common/yup/configureYup";
import {
  INVALID_SIRET_LENGTH,
  INVALID_WASTE_CODE,
  MISSING_COMPANY_ADDRESS,
  MISSING_COMPANY_CONTACT,
  MISSING_COMPANY_EMAIL,
  MISSING_COMPANY_NAME,
  MISSING_COMPANY_PHONE,
  MISSING_COMPANY_SIRET
} from "../forms/validation";
import {
  BsdaAcceptationStatus,
  BsdaConsistence
} from "../generated/graphql/types";
import prisma from "../prisma";

const OPERATIONS = ["D 5", "D 9", "D 13", "D 15"];
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
  | "destinationOperationDate"
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
  | "transporterRecepisseNumber"
  | "transporterRecepisseDepartment"
  | "transporterRecepisseValidityLimit"
>;

type WasteDescription = Pick<
  Bsda,
  | "wasteCode"
  | "wasteName"
  | "wasteFamilyCode"
  | "wasteMaterialName"
  | "wasteConsistence"
  | "wasteSealNumbers"
  | "wasteAdr"
  | "packagings"
  | "weightIsEstimate"
  | "weightValue"
>;

interface BsdaValidationContext {
  isType2710?: boolean;
  isPrivateIndividual?: boolean;
  emissionSignature?: boolean;
  transportSignature?: boolean;
  operationSignature?: boolean;
  workSignature?: boolean;
}

export async function validateBsda(
  bsda: Partial<Prisma.BsdaCreateInput>,
  previousBsdas: Bsda[],
  context: BsdaValidationContext
) {
  await emitterSchema(context)
    .concat(workerSchema(context))
    .concat(destinationSchema(context))
    .concat(transporterSchema(context))
    .concat(wasteDescriptionSchema(context))
    .validate(bsda, { abortEarly: false });

  await validatePreviousBsdas(bsda, previousBsdas);
}

async function validatePreviousBsdas(
  bsda: Partial<Prisma.BsdaCreateInput>,
  previousBsdas: Bsda[]
) {
  if (previousBsdas.length === 0) {
    return;
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

    const allowedOperations = ["D 13", "D 15"];
    if (!allowedOperations.includes(previousBsda.destinationOperationCode)) {
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

const emitterSchema: FactorySchemaOf<
  BsdaValidationContext,
  Emitter
> = context =>
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
        context.emissionSignature && !context.isPrivateIndividual,
        `Émetteur: ${MISSING_COMPANY_NAME}`
      ),
    emitterCompanySiret: yup
      .string()
      .length(14, `Émetteur: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.emissionSignature && !context.isPrivateIndividual,
        `Émetteur: ${MISSING_COMPANY_SIRET}`
      ),
    emitterCompanyAddress: yup
      .string()
      .requiredIf(
        context.emissionSignature && !context.isPrivateIndividual,
        `Émetteur: ${MISSING_COMPANY_ADDRESS}`
      ),
    emitterCompanyContact: yup
      .string()
      .requiredIf(
        context.emissionSignature && !context.isPrivateIndividual,
        `Émetteur: ${MISSING_COMPANY_CONTACT}`
      ),
    emitterCompanyPhone: yup
      .string()
      .requiredIf(
        context.emissionSignature && !context.isPrivateIndividual,
        `Émetteur: ${MISSING_COMPANY_PHONE}`
      ),
    emitterCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.emissionSignature && !context.isPrivateIndividual,
        `Émetteur: ${MISSING_COMPANY_EMAIL}`
      ),
    emitterPickupSiteAddress: yup.string().nullable(),
    emitterPickupSiteCity: yup.string().nullable(),
    emitterPickupSiteInfos: yup.string().nullable(),
    emitterPickupSiteName: yup.string().nullable(),
    emitterPickupSitePostalCode: yup.string().nullable()
  });

const workerSchema: FactorySchemaOf<BsdaValidationContext, Worker> = context =>
  yup.object({
    workerCompanyName: yup
      .string()
      .requiredIf(
        context.emissionSignature && !context.isType2710,
        `Entreprise de travaux: ${MISSING_COMPANY_NAME}`
      ),
    workerCompanySiret: yup
      .string()
      .length(14, `Entreprise de travaux: ${INVALID_SIRET_LENGTH}`)
      .requiredIf(
        context.emissionSignature && !context.isType2710,
        `Entreprise de travaux: ${MISSING_COMPANY_SIRET}`
      ),
    workerCompanyAddress: yup
      .string()
      .requiredIf(
        context.emissionSignature && !context.isType2710,
        `Entreprise de travaux: ${MISSING_COMPANY_ADDRESS}`
      ),
    workerCompanyContact: yup
      .string()
      .requiredIf(
        context.emissionSignature && !context.isType2710,
        `Entreprise de travaux: ${MISSING_COMPANY_CONTACT}`
      ),
    workerCompanyPhone: yup
      .string()
      .requiredIf(
        context.emissionSignature && !context.isType2710,
        `Entreprise de travaux: ${MISSING_COMPANY_PHONE}`
      ),
    workerCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.emissionSignature && !context.isType2710,
        `Entreprise de travaux: ${MISSING_COMPANY_EMAIL}`
      ),
    workerWorkHasEmitterPaperSignature: yup.boolean().nullable()
  });

const destinationSchema: FactorySchemaOf<
  BsdaValidationContext,
  Destination
> = context =>
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
    destinationCap: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: CAP obligatoire`
      ),
    destinationPlannedOperationCode: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        `Entreprise de destination: vous devez préciser le code d'opétation prévu`
      )
      .oneOf(
        [null, ...OPERATIONS],
        "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${values}"
      ),
    destinationReceptionDate: yup
      .date()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination:vous devez préciser la date de réception`
      ) as any,
    destinationReceptionWeight: yup
      .number()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination: vous devez préciser la quantité`
      )
      .when("destinationReceptionAcceptationStatus", {
        is: value => value === WasteAcceptationStatus.REFUSED,
        then: schema =>
          schema.oneOf(
            [0],
            "Vous devez saisir une quantité égale à 0 lorsque le déchet est refusé"
          ),
        otherwise: schema =>
          schema.positive("Vous devez saisir une quantité reçue supérieure à 0")
      }),
    destinationReceptionAcceptationStatus: yup
      .mixed<BsdaAcceptationStatus>()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination: vous devez préciser le statut d'acceptation`
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
    destinationOperationCode: yup
      .string()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination: vous devez préciser le code d'opétation réalisé`
      ),
    destinationOperationDate: yup
      .date()
      .requiredIf(
        context.operationSignature,
        `Entreprise de destination:vous devez préciser la date d'opétation`
      ) as any
  });

const transporterSchema: FactorySchemaOf<
  BsdaValidationContext,
  Transporter
> = context =>
  yup.object({
    transporterRecepisseDepartment: yup
      .string()
      .when("transporterTvaIntracommunautaire", (tva, schema) => {
        if (tva == null) {
          return schema.requiredIf(
            context.transportSignature,
            `Transporteur: le département associé au récépissé est obligatoire`
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterRecepisseNumber: yup
      .string()
      .when("transporterTvaIntracommunautaire", (tva, schema) => {
        if (tva == null) {
          return schema.requiredIf(
            context.transportSignature,
            `Transporteur: le numéro de récépissé est obligatoire`
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterRecepisseValidityLimit: yup
      .date()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ) as any,
    transporterCompanyName: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_NAME}`
      ),
    transporterCompanySiret: yup
      .string()
      .length(14, `Transporteur: ${INVALID_SIRET_LENGTH}`)
      .when("transporterTvaIntracommunautaire", (tva, schema) => {
        if (tva == null) {
          return schema.requiredIf(
            context.transportSignature,
            `Transporteur: le numéro SIRET est obligatoire pour une entreprise française`
          );
        }
        return schema.nullable().notRequired();
      }),
    transporterCompanyAddress: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_ADDRESS}`
      ),
    transporterCompanyContact: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_CONTACT}`
      ),
    transporterCompanyPhone: yup
      .string()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_PHONE}`
      ),
    transporterCompanyMail: yup
      .string()
      .email()
      .requiredIf(
        context.transportSignature,
        `Transporteur: ${MISSING_COMPANY_EMAIL}`
      ),
    transporterCompanyVatNumber: yup.string().nullable()
  });

const wasteDescriptionSchema: FactorySchemaOf<
  BsdaValidationContext,
  WasteDescription
> = context =>
  yup.object({
    wasteCode: yup
      .string()
      .requiredIf(context.emissionSignature, "Le code déchet est obligatoire")
      .oneOf([...WASTES_CODES, "", null], INVALID_WASTE_CODE),
    wasteName: yup
      .string()
      .requiredIf(
        context.emissionSignature,
        "La description déchet est obligatoire"
      ),
    wasteFamilyCode: yup.string().nullable(),
    wasteMaterialName: yup.string().nullable(),
    wasteConsistence: yup
      .mixed<BsdaConsistence>()
      .requiredIf(context.workSignature, `La consistence est obligatoire`),
    wasteSealNumbers: yup.array().ensure().of(yup.string()) as any,
    wasteAdr: yup.string().nullable(),
    packagings: yup.array(),
    weightIsEstimate: yup
      .boolean()
      .requiredIf(context.workSignature, `Le type de quantité est obligatoire`),
    weightValue: yup
      .number()
      .requiredIf(context.workSignature, `La quantité est obligatoire`)
  });
