import React from "react";
import { BsffPackagingInput, PackagingInfoInput } from "@td/codegen-ui";
import BsffPackagingList, { PackagingListProps } from "./BsffPackagingList";
import { useFieldArray, useFormContext } from "react-hook-form";
import RhfBsffPackagingForm from "./RhfBsffPackagingForm";

function RhfBsffPackagingList({
  fieldName,
  packagingTypes,
  disabled = false,
  volumeEditable = false
}: Pick<PackagingListProps, "fieldName" | "packagingTypes" | "disabled"> & {
  volumeEditable?: boolean;
}) {
  const { control, watch } = useFormContext();
  const { append, remove } = useFieldArray({ control, name: fieldName });

  const packagings: (PackagingInfoInput | BsffPackagingInput)[] =
    watch(fieldName) ?? [];

  return (
    <BsffPackagingList
      packagingInfos={packagings}
      packagingTypes={packagingTypes}
      fieldName={fieldName}
      volumeEditable={volumeEditable} // ← à transmettre
      push={append}
      remove={remove}
      disabled={disabled}
    >
      {props => <RhfBsffPackagingForm {...props} />}
    </BsffPackagingList>
  );
}

export default RhfBsffPackagingList;
