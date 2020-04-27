import { inputRule } from "graphql-shield";
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
