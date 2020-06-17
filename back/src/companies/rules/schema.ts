import { inputRule } from "graphql-shield";
import { validDatetime } from "../../forms/rules/validation-helpers";
const SUPPORTED_FORMATS = [
  "image/jpg",
  "image/jpeg",
  "image/gif",
  "image/png",
  "application/pdf"
];

export const createCompanySchema = inputRule()(
  yup =>
    yup.object({
      companyInput: yup.object({
        siret: yup
          .string()
          .required("Le SIRET de l'entreprise est obligatoire"),
        gerepId: yup.string().nullable(true),
        companyTypes: yup
          .array()
          .of(
            yup
              .string()
              .matches(
                /(PRODUCER|COLLECTOR|WASTEPROCESSOR|TRANSPORTER|WASTE_VEHICLES|WASTE_CENTER|TRADER)/
              )
          ),
        codeNaf: yup.string().nullable(true),
        companyName: yup.string().nullable(true),
        documentKeys: yup.array().of(yup.string())
      })
    }),
  {
    abortEarly: false
  }
);

export const createUploadLinkSchema = inputRule()(
  yup =>
    yup.object({
      fileName: yup.string().required("Le non du fichier est obligatoire"),
      fileType: yup
        .string()
        .test("fileType", "Format de fichier non supporté", type =>
          SUPPORTED_FORMATS.includes(type)
        )
    }),
  {
    abortEarly: false
  }
);

export const createTransporterReceiptSchema = inputRule()(yup =>
  yup.object({
    input: yup.object({
      receiptNumber: yup.string().required().nullable(false),
      validityLimit: validDatetime(
        {
          verboseFieldName: "Limite de validité",
          required: true
        },
        yup
      ),
      department: yup.string().required().nullable(false)
    })
  })
);

export const updateTransporterReceiptSchema = inputRule()(yup =>
  yup.object({
    input: yup.object({
      id: yup.string().required().nullable(false),
      receiptNumber: yup.string().notRequired().nullable(),
      validityLimit: validDatetime(
        {
          verboseFieldName: "Limite de validité",
          required: false
        },
        yup
      ),
      department: yup.string().notRequired().nullable()
    })
  })
);

export const deleteTransporterReceiptSchema = inputRule()(yup =>
  yup.object({
    input: yup.object({
      id: yup.string().required().nullable(false)
    })
  })
);

export const createTraderReceiptSchema = inputRule()(yup =>
  yup.object({
    input: yup.object({
      receiptNumber: yup.string().required().nullable(false),
      validityLimit: validDatetime(
        {
          verboseFieldName: "Limite de validité",
          required: true
        },
        yup
      ),
      department: yup.string().required().nullable(false)
    })
  })
);

export const updateTraderReceiptSchema = inputRule()(yup =>
  yup.object({
    input: yup.object({
      id: yup.string().required().nullable(false),
      receiptNumber: yup.string().notRequired().nullable(),
      validityLimit: validDatetime(
        {
          verboseFieldName: "Limite de validité",
          required: false
        },
        yup
      ),
      department: yup.string().notRequired().nullable()
    })
  })
);

export const deleteTraderReceiptSchema = inputRule()(yup =>
  yup.object({
    input: yup.object({
      id: yup.string().required().nullable(false)
    })
  })
);
