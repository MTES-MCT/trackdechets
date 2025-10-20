import { BsdType, CompanySearchResult } from "@td/codegen-ui";
import { isForeignVat } from "@td/constants";
import { CreateOrUpdateTransporterInput } from "../../../form/bsdd/utils/initial-state";
import { AnyTransporterInput } from "../types";
import { CreateOrUpdateBsdaTransporterInput } from "../../../form/bsda/stepper/initial-state";
import { mapBsdTransporter } from "../bsdTransporterMapper";
import { useFormContext, useWatch } from "react-hook-form";

/**
 * ✅ Version React Hook Form du hook useTransporter
 * Remplace totalement la version Formik (useField, getFieldProps, etc.)
 */
export function useTransporterRhf<T extends AnyTransporterInput>(
  fieldName: string,
  bsdType: BsdType
) {
  const { control, setValue } = useFormContext();

  const transporter = useWatch({ control, name: fieldName }) as T;

  const transporterOrgId =
    transporter?.company?.siret ?? transporter?.company?.vatNumber ?? null;

  const setTransporter = (company: CompanySearchResult) => {
    let recepisseIsExempted =
      bsdType === BsdType.Bsdd
        ? Boolean(
            (transporter as CreateOrUpdateTransporterInput)?.isExemptedOfReceipt
          )
        : Boolean(
            (transporter as CreateOrUpdateBsdaTransporterInput)?.recepisse
              ?.isExempted
          );

    if (isForeignVat(company.vatNumber)) {
      recepisseIsExempted = false;
    }

    const updatedTransporter: any = {
      ...transporter,
      company: {
        ...transporter?.company,
        siret: company.siret,
        vatNumber: company.vatNumber,
        country: company.codePaysEtrangerEtablissement,
        name: company.name ?? "",
        address: company.address ?? "",
        ...(transporterOrgId !== company.orgId
          ? {
              contact: company.contact ?? "",
              phone: company.contactPhone ?? "",
              mail: company.contactEmail ?? ""
            }
          : {})
      },
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

    setValue(fieldName, updatedTransporter);
  };

  const transportPlatesFieldName =
    bsdType === BsdType.Bsdd
      ? `${fieldName}.numberPlate`
      : `${fieldName}.transport.plates`;

  const transportModeFieldName =
    bsdType === BsdType.Bsdd
      ? `${fieldName}.mode`
      : `${fieldName}.transport.mode`;

  const transporterRecepisseIsExemptedFieldName =
    bsdType === BsdType.Bsdd
      ? `${fieldName}.isExemptedOfReceipt`
      : `${fieldName}.recepisse.isExempted`;

  return {
    transporterOrgId,
    transporter: mapBsdTransporter(transporter, bsdType),
    setTransporter,
    transportPlatesFieldName,
    transportModeFieldName,
    transporterRecepisseIsExemptedFieldName
  };
}
