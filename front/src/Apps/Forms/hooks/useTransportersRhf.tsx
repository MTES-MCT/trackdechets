import { BsdType } from "@td/codegen-ui";
import { AnyTransporterInput, BsdTransporterInput } from "../types";
import { mapBsdTransporter } from "../bsdTransporterMapper";
import { useFormContext, useWatch } from "react-hook-form";

export function useTransportersRhf<T extends AnyTransporterInput>(
  fieldName: string,
  bsdType: BsdType
): BsdTransporterInput[] {
  const { control } = useFormContext();

  const transporters = useWatch({
    control,
    name: fieldName
  }) as T[] | undefined;

  return (
    transporters
      ?.map(transporter => mapBsdTransporter(transporter, bsdType)!)
      .filter(Boolean) ?? []
  );
}
