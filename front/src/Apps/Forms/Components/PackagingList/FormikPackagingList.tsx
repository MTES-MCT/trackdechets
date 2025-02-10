import React, { useMemo } from "react";
import { PackagingInfoInput } from "@td/codegen-ui";
import {
  FieldArray,
  FormikErrors,
  FormikTouched,
  useField,
  useFormikContext
} from "formik";
import PackagingList, { PackagingListProps } from "./PackagingList";
import FormikPackagingForm from "./FormikPackagingForm";

/**
 * Wrapper qui permet de contrôler <PackagingList /> avec Formik
 */
function FormikPackagingList({
  fieldName,
  disabled = false
}: Pick<PackagingListProps, "fieldName" | "disabled">) {
  const [field, { error }] = useField<PackagingInfoInput[]>(fieldName);

  const { touched } = useFormikContext();

  // Le type des erreurs et de touched n'est pas correctement inféré par Formik ici
  // Peut-être en lien avec https://github.com/jaredpalmer/formik/issues/2347
  const errors = error as any as FormikErrors<PackagingInfoInput[]> | undefined;

  const packagings = field.value;

  const packagingsTouched: FormikTouched<PackagingInfoInput[]> = useMemo(() => {
    return fieldName.split(".").reduce((acc, path) => {
      return acc?.[path];
    }, touched);
  }, [touched, fieldName]);

  return (
    <FieldArray
      name={fieldName}
      render={({ push, remove }) => (
        <PackagingList
          packagingInfos={packagings}
          fieldName={fieldName}
          push={push}
          remove={remove}
          touched={packagingsTouched}
          errors={errors}
          disabled={disabled}
        >
          {props => <FormikPackagingForm {...props} />}
        </PackagingList>
      )}
    />
  );
}

export default FormikPackagingList;
