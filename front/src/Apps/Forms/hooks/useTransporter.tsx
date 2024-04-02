import { useField } from "formik";
import { BsdType, CompanySearchResult } from "@td/codegen-ui";
import { isForeignVat } from "@td/constants";
import { CreateOrUpdateTransporterInput } from "../../../form/bsdd/utils/initial-state";
import { AnyTransporterInput } from "../types";
import { mapBsdTransporter } from "../bsdTransporterMapper";

// Hook multi-bordereaux qui appelle `useField` et qui renvoie les helpers et
// champs nécessaires pour read / update les infos d'un transporteur
// dans Formik en fonction du type de bordereau.
export function useTransporter<T extends AnyTransporterInput>(
  fieldName: string,
  bsdType: BsdType
) {
  const [field, _, { setValue }] = useField<T>(fieldName);

  const transporter = field.value;

  const transporterOrgId =
    transporter?.company?.siret ?? transporter?.company?.vatNumber ?? null;

  const setTransporter = (company: CompanySearchResult) => {
    const recepisseIsExempted = isForeignVat(company.vatNumber)
      ? // l'obligation de récépissé ne concerne pas les transporteurs étrangers
        // on force la valeur à `false` et on désactive le champ
        false
      : (transporter as CreateOrUpdateTransporterInput).isExemptedOfReceipt;

    const updatedTransporter = {
      ...transporter,
      company: {
        ...transporter.company,
        siret: company.siret,
        vatNumber: company.vatNumber,
        country: company.codePaysEtrangerEtablissement,
        // auto-completion de la raison sociale et de l'adresse
        name: company.name ?? "",
        address: company.address ?? "",
        ...(transporterOrgId !== company.orgId
          ? {
              // auto-completion des infos de contact uniquement
              // s'il y a un changement d'établissement pour
              // éviter d'écraser les infos de contact spécifiées par l'utilisateur
              // lors d'une modification de bordereau
              contact: company.contact ?? "",
              phone: company.contactPhone ?? "",
              mail: company.contactEmail ?? ""
            }
          : {})
      },
      // auto-complétion du récépissé de transport
      ...(bsdType === BsdType.Bsdd
        ? {
            receipt: company.transporterReceipt?.receiptNumber,
            validityLimit: company.transporterReceipt?.validityLimit,
            department: company.transporterReceipt?.department,
            isExemptedOfReceipt: recepisseIsExempted
          }
        : {
            recepisse: {
              isExempted: recepisseIsExempted,
              number: company.transporterReceipt?.receiptNumber,
              validityLimit: company.transporterReceipt?.validityLimit,
              department: company.transporterReceipt?.department
            }
          })
    };
    setValue(updatedTransporter);
  };

  const transportPlatesField =
    bsdType === BsdType.Bsdd
      ? `${fieldName}.numberPlate`
      : `${fieldName}.transport.plates`;

  const transportModeField =
    bsdType === BsdType.Bsdd
      ? `${fieldName}.mode`
      : `${fieldName}.transport.mode`;

  const transporterRecepisseIsExemptedField =
    bsdType === BsdType.Bsdd
      ? `${fieldName}.isExemptedOfReceipt`
      : `${fieldName}.recepisse.isExempted`;

  return {
    transporterOrgId,
    transporter: mapBsdTransporter(transporter, bsdType),
    setTransporter,
    transportPlatesField,
    transportModeField,
    transporterRecepisseIsExemptedField
  };
}
