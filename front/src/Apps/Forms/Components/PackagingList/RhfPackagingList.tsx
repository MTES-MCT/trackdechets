import React from "react";
import { PackagingInfoInput } from "@td/codegen-ui";
import PackagingList, { PackagingListProps } from "./PackagingList";
import { useFieldArray, useFormContext } from "react-hook-form";
import RhfPackagingForm from "./RhfPackagingForm";

/**
 * Wrapper qui permet de contrôler <PackagingList /> avec React Hook Form
 */
function RhfPackagingList({
  fieldName,
  packagingTypes,
  disabled = false,
  type
}: Pick<PackagingListProps, "fieldName" | "packagingTypes" | "disabled"> & { type: "BSDA" | "BSDD" | "BSFF" }) {
  const { control, watch } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: fieldName
  });

  const packagings: PackagingInfoInput[] = watch(fieldName);
  return (
    <PackagingList
      packagingInfos={packagings}
      packagingTypes={packagingTypes}
      fieldName={fieldName}
      push={append}
      remove={remove}
      disabled={disabled}
      type={type}
    >
      {props => <RhfPackagingForm {...props} />}
    </PackagingList>
  );
}

export default RhfPackagingList;
