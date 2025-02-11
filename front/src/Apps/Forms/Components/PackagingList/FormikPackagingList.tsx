import React from "react";
import { PackagingInfoInput } from "@td/codegen-ui";
import { FieldArray, useField } from "formik";
import PackagingList, { PackagingListProps } from "./PackagingList";
import FormikPackagingForm from "./FormikPackagingForm";

/**
 * Wrapper qui permet de contrôler <PackagingList /> avec Formik
 */
function FormikPackagingList({
  fieldName,
  disabled = false
}: Pick<PackagingListProps, "fieldName" | "disabled">) {
  const [field] = useField<PackagingInfoInput[]>(fieldName);

  const packagings = field.value;

  return (
    <FieldArray
      name={fieldName}
      render={({ push, remove }) => (
        <PackagingList
          packagingInfos={packagings}
          fieldName={fieldName}
          push={push}
          remove={remove}
          disabled={disabled}
        >
          {props => <FormikPackagingForm {...props} />}
        </PackagingList>
      )}
    />
  );
}

export default FormikPackagingList;
