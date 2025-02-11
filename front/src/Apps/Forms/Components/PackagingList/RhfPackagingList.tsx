import React, { useMemo } from "react";
import PackagingList, { PackagingListProps } from "./PackagingList";
import { useFieldArray, useFormContext } from "react-hook-form";
import RhfPackagingForm from "./RHFPackagingForm";

function RhfPackagingList({
  fieldName,
  disabled = false
}: Pick<PackagingListProps, "fieldName" | "disabled">) {
  const { control, watch, formState } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: fieldName
  });

  const packagings = watch(fieldName);

  return (
    <PackagingList
      packagingInfos={packagings}
      fieldName={fieldName}
      push={append}
      remove={remove}
      disabled={disabled}
      errors={[]}
      touched={[]}
    >
      {props => <RhfPackagingForm {...props} />}
    </PackagingList>
  );
}

export default RhfPackagingList;
