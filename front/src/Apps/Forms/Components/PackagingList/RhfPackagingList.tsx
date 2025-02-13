import React from "react";
import PackagingList, { PackagingListProps } from "./PackagingList";
import { useFieldArray, useFormContext } from "react-hook-form";
import RhfPackagingForm from "./RhfPackagingForm";

/**
 * Wrapper qui permet de contrôler <PackagingList /> avec React Hook Form
 */
function RhfPackagingList({
  fieldName,
  disabled = false
}: Pick<PackagingListProps, "fieldName" | "disabled">) {
  const { control, watch } = useFormContext();
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
    >
      {props => <RhfPackagingForm {...props} />}
    </PackagingList>
  );
}

export default RhfPackagingList;
