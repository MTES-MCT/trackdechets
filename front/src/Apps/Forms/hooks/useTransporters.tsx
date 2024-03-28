import { useField } from "formik";
import { BsdType } from "@td/codegen-ui";
import { AnyTransporterInput, BsdTransporterInput } from "../types";
import { mapBsdTransporter } from "../bsdTransporterMapper";

// Hook multi-bordereaux qui appelle `useField` et qui renvoie les helpers et
// champs nécessaires pour lire la liste des transporteurs
// dans Formik
export function useTransporters<T extends AnyTransporterInput>(
  fieldName: string,
  bsdType: BsdType
): BsdTransporterInput[] {
  const [field] = useField<T[]>({
    name: fieldName
  });

  const transporters = field.value;

  return transporters
    .map(transporter => mapBsdTransporter(transporter, bsdType)!)
    .filter(Boolean);
}
