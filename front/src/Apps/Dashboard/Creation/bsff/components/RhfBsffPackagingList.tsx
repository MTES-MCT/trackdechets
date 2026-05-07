import React from "react";
import { PackagingInfoInput } from "@td/codegen-ui";
import BsffPackagingList, { PackagingListProps } from "./BsffPackagingList";
import { useFieldArray, useFormContext } from "react-hook-form";
import RhfBsffPackagingForm from "./RhfBsffPackagingForm";

function RhfBsffPackagingList({
  fieldName,
  packagingTypes,
  disabled = false
}: Pick<PackagingListProps, "fieldName" | "packagingTypes" | "disabled">) {
  const { control, watch, setValue, getValues } = useFormContext(); // ← getValues
  const { append, remove } = useFieldArray({ control, name: fieldName });

  const packagings: PackagingInfoInput[] = watch(fieldName) ?? [];

  const handleRemoveFromTable = (id: string) => {
    const currentPackagings: any[] = getValues(fieldName) ?? []; // ← instantané
    const currentRepackaging: any[] = getValues("repackaging") ?? []; // ← instantané

    const updated = currentRepackaging.filter((r: any) => r.id !== id);
    setValue("repackaging", updated);

    const manualPackagings = currentPackagings.filter((p: any) => !p.id);
    const remainingTablePackagings = updated.flatMap((r: any) => {
      if (r.packagings?.length) return r.packagings;
      return [
        {
          id: r.id ?? null,
          type: r.type ?? null,
          volume: r.volume ?? null,
          numero: r.numero ?? "",
          weight: r.acceptation?.weight ?? null,
          other: r.other ?? null
        }
      ];
    });

    setValue(fieldName, [...remainingTablePackagings, ...manualPackagings]);

    setValue(
      "weight.value",
      updated.reduce(
        (sum: number, r: any) => sum + (r.acceptation?.weight ?? r.weight ?? 0),
        0
      )
    );
  };

  return (
    <BsffPackagingList
      packagingInfos={packagings}
      packagingTypes={packagingTypes}
      fieldName={fieldName}
      push={append}
      remove={remove}
      disabled={disabled}
      onRemoveFromTable={handleRemoveFromTable}
    >
      {props => <RhfBsffPackagingForm {...props} />}
    </BsffPackagingList>
  );
}

export default RhfBsffPackagingList;
