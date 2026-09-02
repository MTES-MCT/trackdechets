import { z } from "zod";
import { BSFF_WASTE_CODES } from "@td/constants";

const BSFF_OPERATION_CODES = [
  "R1",
  "R2",
  "R3",
  "R5",
  "R12",
  "R13",
  "D10",
  "D13",
  "D14",
  "D15"
] as const;

const TransportMode = {
  ROAD: "ROAD",
  RAIL: "RAIL",
  AIR: "AIR",
  RIVER: "RIVER",
  SEA: "SEA",
  OTHER: "OTHER",
  UNKNOWN: "UNKNOWN"
} as const;

const BsffPackagingType = {
  BOUTEILLE: "BOUTEILLE",
  CONTENEUR: "CONTENEUR",
  CITERNE: "CITERNE",
  AUTRE: "AUTRE"
} as const;

const BsffType = {
  TRACER_FLUIDE: "TRACER_FLUIDE",
  COLLECTE_PETITES_QUANTITES: "COLLECTE_PETITES_QUANTITES",
  GROUPEMENT: "GROUPEMENT",
  RECONDITIONNEMENT: "RECONDITIONNEMENT",
  REEXPEDITION: "REEXPEDITION"
} as const;

const zodCompany = z
  .object({
    siret: z.string().nullish(),
    orgId: z.string().nullish(),
    vatNumber: z.string().nullish(),
    name: z.string().nullish(),
    contact: z.string().nullish(),
    phone: z.string().nullish(),
    mail: z.string().nullish(),
    address: z.string().nullish()
  })
  .nullish();

const zodSignature = z
  .object({
    author: z.string().nullish(),
    date: z.coerce.date().nullish()
  })
  .nullish();

export const ZodWasteCodeEnum = z
  .enum(BSFF_WASTE_CODES, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return {
          message:
            `Le code déchet ne fait pas partie de la` +
            ` liste reconnue : ${BSFF_WASTE_CODES.join(", ")}`
        };
      }
      return { message: ctx.defaultError };
    }
  })
  .nullish();

export type ZodWasteCodeEnum = z.infer<typeof ZodWasteCodeEnum>;

export const ZodOperationEnum = z
  .enum(BSFF_OPERATION_CODES, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return {
          message:
            "Le code de l'opération de traitement ne fait pas" +
            ` partie de la liste reconnue : ${BSFF_OPERATION_CODES.join(", ")}`
        };
      }
      return { message: ctx.defaultError };
    }
  })
  .nullish();

const bsffPackagingSchema = z
  .object({
    id: z.string().nullish(),
    type: z.nativeEnum(BsffPackagingType),
    other: z.string().max(250).nullish(),
    quantity: z.coerce.number().nonnegative().nullish(),
    volume: z.coerce
      .number({
        required_error: "Conditionnements : le volume doit être supérieure à 0"
      })
      .positive("Conditionnements : le volume doit être supérieur à 0"),
    weight: z.coerce
      .number({
        required_error: "Conditionnements : le poids doit être supérieur à 0"
      })
      .positive("Conditionnements : le poids doit être supérieur à 0"),
    numero: z
      .string({
        required_error:
          "Conditionnements : le numéro d'identification est requis"
      })
      .min(1, "Conditionnements : le numéro d'identification est requis")
  })
  .refine(val => val.type !== "AUTRE" || !!val.other, {
    path: ["other"],
    message:
      "Vous devez saisir la description du conditionnement quand le type de conditionnement est 'Autre'"
  });

const bsffGroupingOrForwardingSchema = z.object({
  id: z.string(),
  bsffId: z.string().nullish(),
  numero: z.string().nullish(),
  type: z.nativeEnum(BsffPackagingType),
  other: z.string().nullish(),
  volume: z.number().nonnegative().nullish(),
  acceptation: z
    .object({
      wasteCode: z.string().nullish(),
      wasteDescription: z.string().nullish(),
      weight: z.coerce.number().nonnegative().nullish()
    })
    .nullish(),
  waste: z
    .object({
      code: z.string().nullish(),
      adr: z.string().nullish(),
      weightValue: z.coerce.number().nonnegative().nullish(),
      description: z.string().max(250).nullish()
    })
    .nullish(),
  plannedOperationCode: ZodOperationEnum,
  bsff: z.object({
    emitter: z
      .object({
        company: zodCompany.nullish()
      })
      .nullish()
  }),
  packagings: z.array(bsffPackagingSchema).nullish(),
  nextBsff: z
    .object({
      emitter: z
        .object({
          company: zodCompany.nullish()
        })
        .nullish()
    })
    .nullish()
});

const ficheInterventionSchema = z.object({
  id: z.string().nullish(),

  holderType: z
    .enum(["ENTREPRISE", "PARTICULIER", "ASSOCIATION", "NAVIRE"])
    .optional()
    .or(z.literal("")),

  identification: z.string().max(250).optional().or(z.literal("")),

  isExempted: z.boolean().default(false),

  numero: z.string().max(250).optional().or(z.literal("")),

  weight: z.preprocess(
    val => (val === "" ? undefined : val),
    z
      .number()
      .nonnegative("le poids doit être supérieur ou égal à 0")
      .optional()
  ),

  postalCode: z.string().optional().or(z.literal("")),

  detenteur: z
    .object({
      isPrivateIndividual: z.boolean().optional(),
      company: zodCompany
    })
    .optional(),
  packagings: z
    .array(
      z.object({
        numero: z.string()
      })
    )
    .optional()
    .nullish()
});

export const rawBsffSchema = z
  .object({
    id: z.string().nullish(),
    type: z
      .nativeEnum(BsffType)
      .nullish()
      .transform(t => t ?? BsffType.COLLECTE_PETITES_QUANTITES),
    emitter: z
      .object({
        company: zodCompany,
        customInfo: z.string().max(250).nullish(),
        emission: zodSignature,
        pickupSite: z
          .object({
            name: z.string().max(250).nullish(),
            address: z.string().max(250).nullish(),
            street: z.string().max(250).nullish(),
            address2: z.string().max(250).nullish(),
            city: z.string().max(250).nullish(),
            postalCode: z.string().max(250).nullish(),
            infos: z.string().max(250).nullish()
          })
          .nullish()
      })
      .nullish(),
    pickupSiteEnabled: z.boolean().default(false),
    pickupSiteManualMode: z.boolean().default(false),
    equipmentHolderDifferent: z.boolean().default(false),
    fluidesFrigorigenesEnabled: z.boolean().default(false),
    waste: z
      .object({
        code: ZodWasteCodeEnum,
        adr: z.string().max(750).nullish(),
        description: z.string().max(250).nullish()
      })
      .nullish(),
    weight: z
      .object({
        value: z.coerce.number().nonnegative().nullish(),
        isEstimate: z.boolean().nullish()
      })
      .nullish(),
    totalWeight: z.coerce.number().nonnegative().nullish(),
    destination: z
      .object({
        company: zodCompany,
        customInfo: z.string().max(250).nullish(),
        cap: z.string().max(250).nullish(),
        reception: z.object({
          date: z.coerce.date().nullish(),
          signature: zodSignature
        }),
        plannedOperationCode: ZodOperationEnum
      })
      .nullish(),
    detenteurCompanySirets: z.array(z.string().max(250)).optional().nullish(),
    transporters: z
      .array(
        z
          .object({
            id: z.string().nullish(),
            number: z.coerce.number().nonnegative().nullish(),
            company: zodCompany,
            customInfo: z.string().nullish(),
            recepisse: z.object({
              isExempted: z.boolean().nullish(),
              number: z.string().nullish(),
              department: z.string().nullish(),
              validityLimit: z.coerce.date().nullish()
            }),
            transport: z.object({
              mode: z.nativeEnum(TransportMode).nullish(),
              plates: z.array(z.string()),
              takenOverAt: z.coerce.date().nullish(),
              signature: zodSignature
            })
          })
          .nullish()
      )
      .max(5, "Vous ne pouvez pas ajouter plus de 5 transporteurs")
      .optional(),
    packagings: z.array(bsffPackagingSchema).nullish(),
    ficheInterventions: z.array(ficheInterventionSchema).optional().nullish(),
    repackaging: z.array(bsffGroupingOrForwardingSchema).optional().nullish(),
    grouping: z.array(bsffGroupingOrForwardingSchema).optional().nullish(),
    forwarding: bsffGroupingOrForwardingSchema.nullish()
  })
  .superRefine((data, ctx) => {
    const blank = (value?: string | null) => !value?.trim();
    if (data.type === BsffType.TRACER_FLUIDE) {
      const company = data.emitter?.company;
      const requiredCompanyFields: [string, string][] = [
        ["contact", "La personne à contacter est requise"],
        ["phone", "Le téléphone est requis"],
        ["mail", "Le courriel est requis"]
      ];
      if (blank(company?.siret) && blank(company?.orgId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["emitter", "company", "siret"],
          message: "Le détenteur est requis"
        });
      }
      requiredCompanyFields.forEach(([field, message]) => {
        if (blank(company?.[field]))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emitter", "company", field],
            message
          });
      });
      if (blank(data.waste?.code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waste", "code"],
          message: "Le code déchet est requis"
        });
      }
      if (blank(data.waste?.description)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["waste", "description"],
          message: "La dénomination usuelle du déchet est requise"
        });
      }
      if (!data.packagings?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["packagings"],
          message: "Au moins un contenant est requis"
        });
      }
      if (data.weight?.value == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weight", "value"],
          message: "La quantité totale de fluide est requise"
        });
      }
      if (
        company?.phone &&
        !/^(?=.*\d)[0-9#.+-]+$/.test(company.phone.trim())
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["emitter", "company", "phone"],
          message:
            "Le téléphone ne peut contenir que des chiffres et les caractères # - + ."
        });
      }
      if (data.pickupSiteEnabled) {
        const site = data.emitter?.pickupSite;
        if (blank(site?.name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emitter", "pickupSite", "name"],
            message: "Le nom du site d'enlèvement est requis"
          });
        }

        if (!data.pickupSiteManualMode && blank(site?.address)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emitter", "pickupSite", "address"],
            message: "L'adresse de collecte est requise"
          });
        }

        if (data.pickupSiteManualMode && blank(site?.street)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emitter", "pickupSite", "street"],
            message: "Le numéro et libellé de voie est requis"
          });
        }

        if (data.pickupSiteManualMode && blank(site?.postalCode)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emitter", "pickupSite", "postalCode"],
            message: "Le code postal est requis"
          });
        }

        if (data.pickupSiteManualMode && blank(site?.city)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emitter", "pickupSite", "city"],
            message: "La commune est requise"
          });
        }
      }
    }

    if (
      data.type === BsffType.COLLECTE_PETITES_QUANTITES ||
      (data.type === BsffType.TRACER_FLUIDE && data.equipmentHolderDifferent)
    ) {
      const holders = data.ficheInterventions ?? [];
      if (!holders.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ficheInterventions"],
          message: "Au moins un détenteur doit être renseigné"
        });
      }

      holders.forEach((holder, index) => {
        const path = ["ficheInterventions", index];
        const holderCompany = holder.detenteur?.company;
        if (
          data.type === BsffType.COLLECTE_PETITES_QUANTITES &&
          !holder.isExempted &&
          blank(holder.numero)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "numero"],
            message: "Le numéro de fiche d'intervention est requis"
          });
        }
        if (!holder.holderType) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "holderType"],
            message: "Le type de détenteur est requis"
          });
        }
        if (
          holder.holderType === "ENTREPRISE" &&
          blank(holderCompany?.siret) &&
          blank(holderCompany?.orgId)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "identification"],
            message: "L'entreprise détentrice est requise"
          });
        }
        if (
          ["ASSOCIATION", "NAVIRE"].includes(holder.holderType ?? "") &&
          blank(holder.identification)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "identification"],
            message: "L'identification du détenteur est requise"
          });
        }
        if (
          holder.holderType === "NAVIRE" &&
          holder.identification &&
          !/^OMI\d{7}$/.test(holder.identification)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "identification"],
            message: "Le numéro OMI doit contenir OMI suivi de 7 chiffres"
          });
        }
        if (
          holder.holderType === "ASSOCIATION" &&
          holder.identification &&
          !/^W\d{9}$/.test(holder.identification)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "identification"],
            message: "Le numéro RNA doit contenir W suivi de 9 chiffres"
          });
        }
        (["contact", "phone", "mail"] as const).forEach(field => {
          if (blank(holderCompany?.[field])) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [...path, "detenteur", "company", field],
              message: `Le champ ${field} est requis`
            });
          }
        });
        if (
          holderCompany?.phone &&
          !/^(?=.*\d)[0-9#.+-]+$/.test(holderCompany.phone.trim())
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "detenteur", "company", "phone"],
            message:
              "Le téléphone ne peut contenir que des chiffres et les caractères # - + ."
          });
        }
        if (
          holderCompany?.mail &&
          !z.string().email().safeParse(holderCompany.mail).success
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "detenteur", "company", "mail"],
            message: "Le courriel n'est pas valide"
          });
        }
        if (!holder.packagings?.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "packagings"],
            message:
              "Vous avez déclaré au moins un contenant sans détenteur associé ou un détenteur sans lui associer de contenant merci de vérifier."
          });
        }
      });

      const linkedPackagingNumbers = new Set(
        holders.flatMap(holder =>
          (holder.packagings ?? []).map(packaging => packaging.numero)
        )
      );
      const emitterSiret = data.emitter?.company?.siret;
      const isEmitterDeclaredAsHolder = holders.some(
        holder => holder.detenteur?.company?.siret === emitterSiret
      );
      (data.packagings ?? []).forEach((packaging, index) => {
        if (packaging.numero && !linkedPackagingNumbers.has(packaging.numero)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["packagings", index, "numero"],
            message:
              emitterSiret && !isEmitterDeclaredAsHolder
                ? `Le contenant #${packaging.numero} n'a pas été affecté. Si vous êtes détenteur de ce déchet et détenteur de l'équipement vous devez vous ajouter dans l'onglet détenteur afin de pouvoir vous affecter le contenant.`
                : `Vous avez déclaré au moins un contenant sans détenteur associé ou un détenteur sans lui associer de contenant merci de vérifier.`
          });
        }
      });
    }
  });
export type ZodBsff = z.infer<typeof rawBsffSchema>;

export type ZodBsffGroupingOrForwarding = z.infer<
  typeof bsffGroupingOrForwardingSchema
>;
