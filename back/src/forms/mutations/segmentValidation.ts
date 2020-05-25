import * as Yup from "yup";
import { validDatetime } from "../rules/validation-helpers";

const segmentSchema = Yup.object<any>().shape({
  id: Yup.string().label("Identifiant (id)").required(),
  transporterCompanySiret: Yup.string()
    .label("Siret du transporteur")
    .required(),
  transporterCompanyAddress: Yup.string().required(),
  transporterCompanyContact: Yup.string().required(),
  transporterCompanyPhone: Yup.string().required(),
  transporterCompanyMail: Yup.string().required(),
  transporterIsExemptedOfReceipt: Yup.boolean().nullable(true),
  transporterReceipt: Yup.string().when(
    "isExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema.required(
            "Vous n'avez pas précisé bénéficier de l'exemption de récépissé, il est donc est obligatoire"
          )
  ),
  transporterDepartment: Yup.string().when(
    "isExemptedOfReceipt",
    (isExemptedOfReceipt, schema) =>
      isExemptedOfReceipt
        ? schema.nullable(true)
        : schema.required("Le département du transporteur est obligatoire")
  ),
  transporterValidityLimit: validDatetime(
    {
      verboseFieldName: "date de validité",
      required: true,
    },
    Yup
  ),
  transporterNumberPlate: Yup.string().nullable(true),
});

export default function isSegmentValidForTakeOver(segment) {
  return segmentSchema.isValid(segment);
}
