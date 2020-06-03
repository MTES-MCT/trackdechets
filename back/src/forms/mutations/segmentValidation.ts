import * as Yup from "yup";
import { validDatetime } from "../rules/validation-helpers";

export const segmentSchema = Yup.object<any>().shape({
  // id: Yup.string().label("Identifiant (id)").required(),
  mode: Yup.string()
  .label("Mode de transport")
  .required(),
  transporterCompanySiret: Yup.string()
    .label("Siret du transporteur")
    .required(),
  transporterCompanyAddress: Yup.string() ,
  transporterCompanyContact: Yup.string() ,
  transporterCompanyPhone: Yup.string() ,
  transporterCompanyMail: Yup.string() ,
  transporterIsExemptedOfReceipt: Yup.boolean().nullable(true),
  transporterReceipt: Yup.string().when(
    "transporterIsExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema.required(
            "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
          )
  ),
  transporterDepartment: Yup.string().when(
    "transporterIsExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema.required("Le département du transporteur est obligatoire")
  ),

  transporterValidityLimit: validDatetime(
    {
      verboseFieldName: "date de validité",
    },
    Yup
  ),
  transporterNumberPlate: Yup.string().nullable(true)
});

 

export const takeOverInfoSchema = Yup.object<any>().shape({
  takenOverAt: validDatetime(
    {
      verboseFieldName: "date de prise en charge",
      required: true
    },
    Yup
  ),
  takenOverBy: Yup.string().required("Le nom du responsable est obligatoire")
});
