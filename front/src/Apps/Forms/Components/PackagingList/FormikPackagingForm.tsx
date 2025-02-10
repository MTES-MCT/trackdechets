import React from "react";
import { FieldArray, useFormikContext } from "formik";
import PackagingForm from "./PackagingForm";
import { Packagings } from "@td/codegen-ui";
import Decimal from "decimal.js";
import { RenderPackagingFormProps } from "./PackagingList";

/**
 * Wrapper qui permet de contrôler le composant <PackagingForm /> avec Formik
 */
function FormikPackagingForm({
  fieldName,
  packaging,
  packagingsLength,
  idx,
  disabled = false,
  errors,
  touched
}: RenderPackagingFormProps) {
  const { getFieldProps, setFieldValue } = useFormikContext();

  const typeInputProps = getFieldProps(`${fieldName}.${idx}.type`);
  const volumeInputProps = getFieldProps(`${fieldName}.${idx}.volume`);

  if (typeInputProps.value === Packagings.Benne) {
    // Dans le cas d'une benne, on veut pouvoir afficher et entrer
    // le volume en m3 tout en gardant des litres côté API. Il faut donc
    // faire la conversion m3 <-> litres dans les deux sens.
    volumeInputProps.value = volumeInputProps.value
      ? new Decimal(volumeInputProps.value).dividedBy(1000).toNumber()
      : "";
    volumeInputProps.onChange = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const newValue = event.target.value
        ? new Decimal(event.target.value).times(1000).toNumber()
        : "";
      setFieldValue(volumeInputProps.name, newValue);
    };
  }

  return (
    <FieldArray
      name={`${fieldName}.${idx}.identificationNumbers`}
      render={({
        push: pushIdentificationNumber,
        remove: removeIdentificationNumber
      }) => (
        <PackagingForm
          packaging={packaging}
          packagingsLength={packagingsLength}
          inputProps={{
            type: typeInputProps,
            volume: volumeInputProps,
            quantity: getFieldProps(`${fieldName}.${idx}.quantity`),
            other: getFieldProps(`${fieldName}.${idx}.other`),
            identificationNumbers: {
              push: pushIdentificationNumber,
              remove: removeIdentificationNumber
            }
          }}
          disabled={disabled}
          errors={errors}
          touched={touched}
        />
      )}
    />
  );
}

export default FormikPackagingForm;
