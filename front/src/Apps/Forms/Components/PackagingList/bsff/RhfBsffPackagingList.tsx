import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import BsffPackagingList, { PackagingListProps } from "./BsffPackagingList";
import RhfBsffPackagingForm from "./RhfBsffPackagingForm";
import { BsffPackagingInput } from "@td/codegen-ui";

function RhfBsffPackagingList({
  fieldName,
  packagingTypes,
  disabled = false
}: Pick<PackagingListProps, "fieldName" | "packagingTypes" | "disabled">) {
  const { control, watch } = useFormContext();

  const { append, remove } = useFieldArray({
    control,
    name: fieldName
  });

  const packagings: BsffPackagingInput[] = watch(fieldName);

  return (
    <BsffPackagingList
      fieldName={fieldName}
      packagingTypes={packagingTypes}
      packagingInfos={packagings}
      push={append}
      remove={remove}
      disabled={disabled}
    >
      {props => <RhfBsffPackagingForm {...props} />}
    </BsffPackagingList>
  );
}

export default RhfBsffPackagingList;
