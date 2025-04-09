import { z } from "zod";
import {
  getInitialBroker,
  getInitialTrader
} from "../../../../../../form/bsdd/utils/initial-state";
import { ALL_WASTES } from "@td/constants";
import { getInitialCompany } from "../../../../../common/data/initialState";

export const initialDasriReview = {
  emitter: {
    pickupSite: {
      name: null,
      address: null,
      city: null,
      postalCode: null,
      infos: null
    }
  },
  destination: {
    reception: { packagings: null },
    operation: {
      weight: null,
      code: null,
      mode: null
    }
  },
  waste: { code: null },
  comment: ""
};

const bsdasriPackagingSchema = z
  .object({
    type: z.enum(
      [
        "BOITE_CARTON",
        "FUT",
        "BOITE_PERFORANTS",
        "GRAND_EMBALLAGE",
        "GRV",
        "AUTRE"
      ],
      {
        required_error: "Ce champ est requis",
        invalid_type_error: "Ce champ est requis"
      }
    ),
    other: z.string(),
    volume: z.coerce
      .number()
      .positive("Ce champ est requis est doit être supérieur à 0"),

    quantity: z.coerce
      .number()
      .positive("Ce champ est requis est doit être supérieur à 0")
  })
  .superRefine((values, context) => {
    if (values.type === "AUTRE" && !values.other) {
      context.addIssue({
        code: z.ZodIssueCode.custom,

        message: "Veuillez préciser le conditionnement",

        path: ["other"]
      });
    }
  });

export const getDasriSchema = () =>
  z.object({
    emitter: z
      .object({
        pickupSite: z.object({
          name: z.string().nullish(),
          address: z.string().nullish(),
          city: z.string().nullish(),
          postalCode: z.string().nullish(),
          infos: z.string().nullish()
        })
      })
      .nullish(),
    destination: z
      .object({
        reception: z.object({
          packagings: z.array(bsdasriPackagingSchema).nullish()
        }),
        operation: z.object({
          weight: z.coerce.number().nonnegative().nullish(),

          code: z.string().nullish(),
          mode: z.string().nullish()
        })
      })
      .nullish(),
    waste: z.object({ code: z.string().nullish() }),
    isCanceled: z.boolean().nullish(),
    comment: z
      .string()
      .min(3, "Le commentaire doit faire au moins 3 caractères")
  });

const company_schema = z.object({
  orgId: z.string().nullish(),
  siret: z.string().nullish(),
  name: z.string().nullish(),
  address: z.string().nullish(),
  contact: z.string().nullish(),
  mail: z.string().nullish(),
  phone: z.string().nullish(),
  vatNumber: z.string().nullish(),
  country: z.string().nullish(),
  omiNumber: z.string().nullish()
});

const bsdd_broker_trader_Schema = z
  .object({
    receipt: z.string().nullish(),
    department: z.string().nullish(),
    validityLimit: z.string().nullish(),
    company: company_schema
  })
  .nullable();

export const initialBsddReview: BsddRevisionRequestValidationSchema = {
  wasteDetails: {
    code: "",
    name: "",
    pop: null,
    packagingInfos: [],
    sampleNumber: "",
    quantity: null
  },
  trader: getInitialTrader(),
  broker: getInitialBroker(),
  recipient: {
    cap: ""
  },
  quantityReceived: null,
  quantityRefused: null,
  processingOperationDone: "",
  destinationOperationMode: null,
  processingOperationDescription: "",
  temporaryStorageDetail: {
    temporaryStorer: {
      quantityReceived: null,
      quantityRefused: null
    },
    destination: {
      cap: "",
      processingOperation: ""
    }
  },
  isCanceled: false,
  comment: ""
};

export const validationBsddSchema = z.object({
  comment: z.string().min(3, "Le commentaire doit faire au moins 3 caractères"),
  isCanceled: z.boolean().nullish(),
  wasteDetails: z.object({
    code: z
      .string()
      .nullish()
      .superRefine((wasteCode, context) => {
        if (wasteCode) {
          const wasteCodeWithoutSpaces = wasteCode?.replace(/\s+/g, "") ?? "";
          if (wasteCodeWithoutSpaces.length < 6) {
            context.addIssue({
              code: z.ZodIssueCode.custom,

              message:
                "Le code déchet saisi n'existe pas. Il doit être composé d'au moins 6 caractères."
            });
          }
          if (wasteCodeWithoutSpaces.length > 7) {
            context.addIssue({
              code: z.ZodIssueCode.custom,

              message:
                "Le code déchet saisi n'existe pas. Il doit être composé de moins de 7 caractères."
            });
          }

          if (!ALL_WASTES.find(waste => waste.code === wasteCode)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,

              message: "Le code déchet saisi n'existe pas."
            });
          }
        }
      }),
    name: z.string().nullish(),
    pop: z.boolean().nullish(),
    packagingInfos: z
      .array(
        z
          .object({
            type: z.string().min(1, "Ce champ est requis"),
            volume: z
              .union([z.string(), z.number()])
              .nullish()
              .transform(val =>
                val === "" || val === null || val === undefined
                  ? null
                  : Number(val)
              )
              .refine(
                v => v === null || v > 0,
                "Le volume doit être supérieur à 0"
              ),
            other: z.string().nullish(),
            quantity: z.coerce
              .number()
              .positive("Ce champ est requis est doit être supérieur à 0"),
            identificationNumbers: z.array(z.string()).nullish()
          })
          .superRefine((values, context) => {
            if (values.type === "AUTRE" && !values.other) {
              context.addIssue({
                code: z.ZodIssueCode.custom,

                message: "Veuillez préciser le type de conditionnement",

                path: ["other"]
              });
            }
          })
      )
      .nullish(),
    sampleNumber: z.string().nullish(),
    quantity: z.number().nullish()
  }),
  trader: bsdd_broker_trader_Schema,
  broker: bsdd_broker_trader_Schema,
  recipient: z.object({
    cap: z.string().nullish()
  }),
  quantityReceived: z.number().min(0).nullish(),
  quantityRefused: z.number().min(0).nullish(),
  processingOperationDone: z.string().nullish(),
  destinationOperationMode: z.string().nullish(),
  processingOperationDescription: z.string().nullish(),
  temporaryStorageDetail: z.object({
    temporaryStorer: z.object({
      quantityReceived: z.number().min(0).nullish(),
      quantityRefused: z.number().min(0).nullish()
    }),
    destination: z.object({
      cap: z.string().nullish(),
      processingOperation: z.string().nullish()
    })
  })
});

export type BsddRevisionRequestValidationSchema = z.infer<
  typeof validationBsddSchema
>;

export const initialBsdaReview = {
  emitter: {
    pickupSite: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: ""
    }
  },
  waste: {
    code: "",
    pop: null,
    sealNumbers: [],
    materialName: ""
  },
  packagings: [],
  broker: {
    company: getInitialCompany(),
    recepisse: {
      number: "",
      department: "",
      validityLimit: null
    }
  },
  destination: {
    cap: "",
    reception: {
      weight: null
    },
    operation: {
      code: "",
      mode: null,
      description: ""
    }
  },
  isCanceled: false
};

export const validationBsdaSchema = z.object({
  comment: z.string().min(3, "Le commentaire doit faire au moins 3 caractères"),
  isCanceled: z.boolean().nullish(),
  waste: z.object({
    code: z.string().nullish(),
    cap: z.string().nullish(),
    sealNumbers: z.array(z.string()).nullish(),
    materialName: z.string().nullish(),
    pop: z.boolean().nullish()
  }),
  emitter: z.object({
    pickupSite: z.object({
      name: z.string().nullish(),
      address: z.string().nullish(),
      city: z.string().nullish(),
      postalCode: z.string().nullish(),
      infos: z.string().nullish()
    })
  }),
  packagings: z
    .array(
      z
        .object({
          type: z.enum(
            [
              "BIG_BAG",
              "CONTENEUR_BAG",
              "DEPOT_BAG",
              "OTHER",
              "PALETTE_FILME",
              "SAC_RENFORCE"
            ],
            {
              required_error: "Ce champ est requis",
              invalid_type_error: "Ce champ est requis"
            }
          ),
          volume: z
            .union([z.string(), z.number(), z.null()])
            .nullish()
            .transform(val =>
              val === "" || val === null || val === undefined
                ? null
                : Number(val)
            )
            .refine(
              v => v === null || v > 0,
              "Le volume doit être supérieur à 0"
            ),
          other: z.string().nullish(),
          quantity: z.coerce
            .number()
            .positive("Ce champ est requis est doit être supérieur à 0"),
          identificationNumbers: z.array(z.string()).nullish()
        })
        .superRefine((values, context) => {
          if (values.type === "OTHER" && !values.other) {
            context.addIssue({
              code: z.ZodIssueCode.custom,

              message: "Veuillez préciser le conditionnement",

              path: ["other"]
            });
          }
        })
    )
    .nullish(),
  broker: z.object({
    company: company_schema,
    recepisse: z.object({
      number: z.string().nullish(),
      department: z.string().nullish(),
      validityLimit: z.string().nullish()
    })
  }),
  destination: z
    .object({
      cap: z.string().nullish(),
      reception: z.object({
        weight: z.coerce.number().nonnegative().nullish()
      }),
      operation: z.object({
        code: z.string().nullish(),
        mode: z.string().nullish(),
        description: z.string().nullish()
      })
    })
    .nullish()
});
