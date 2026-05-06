import React from "react";
import { PackagingInfoInput } from "@td/codegen-ui";
import BsffPackagingList, { PackagingListProps } from "./BsffPackagingList";
import { useFieldArray, useFormContext } from "react-hook-form";
import RhfBsffPackagingForm from "./RhfBsffPackagingForm";

/**
 * Wrapper qui permet de contrôler <PackagingList /> avec React Hook Form
 */
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

  const packagings: PackagingInfoInput[] = watch(fieldName);
  return (
    <BsffPackagingList
      packagingInfos={packagings}
      packagingTypes={packagingTypes}
      fieldName={fieldName}
      push={append}
      remove={remove}
      disabled={disabled}
    >
      {props => <RhfBsffPackagingForm {...props} />}
    </BsffPackagingList>
  );
}

export default RhfBsffPackagingList;
