import React from "react";
import { FieldArray, useField } from "formik";
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
  disabled = false
}: RenderPackagingFormProps) {
  const fieldPath = (name: string) => `${fieldName}.${idx}.${name}`;

  const [typeInputProps, { error: errorType, touched: touchedType }] =
    useField<Packagings>(fieldPath("type"));

  const [
    volumeInputProps,
    { error: errorVolume, touched: touchedVolume },
    { setValue: setVolumeValue }
  ] = useField<number | string>(fieldPath("volume"));

  const [
    quantityInputProps,
    { error: errorQuantity, touched: touchedQuantity }
  ] = useField<number | string>(fieldPath("quantity"));

  const [otherInputProps, { error: errorOther, touched: touchedOther }] =
    useField<string>(fieldPath("other"));

  // const typeInputProps = getFieldProps(`${fieldName}.${idx}.type`);
  // const volumeInputProps = getFieldProps(`${fieldName}.${idx}.volume`);

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
      setVolumeValue(newValue);
    };
  }

  const errors = {
    type: errorType,
    quantity: errorQuantity,
    volume: errorVolume,
    other: errorOther
  };

  const touched = {
    type: touchedType,
    quantity: touchedQuantity,
    volume: touchedVolume,
    other: touchedOther
  };

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
          disabled={disabled}
          errors={errors}
          touched={touched}
          inputProps={{
            type: typeInputProps,
            volume: volumeInputProps,
            quantity: quantityInputProps,
            other: otherInputProps,
            identificationNumbers: {
              push: pushIdentificationNumber,
              remove: removeIdentificationNumber
            }
          }}
        />
      )}
    />
  );
}

export default FormikPackagingForm;
