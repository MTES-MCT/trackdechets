import React from "react";
import { RenderPackagingFormProps } from "./PackagingList";
import { useFormContext, useFieldArray, useController } from "react-hook-form";
import PackagingForm from "./PackagingForm";
import { Packagings } from "@td/codegen-ui";
import Decimal from "decimal.js";

/**
 * Wrapper qui permet de contrôler le composant <PackagingForm /> avec React Hook Form
 */
function RhfPackagingForm({
  fieldName,
  packaging,
  packagingsLength,
  packagingTypes,
  idx,
  disabled = false
}: RenderPackagingFormProps) {
  const fieldPath = (name: string) => `${fieldName}.${idx}.${name}`;

  const {
    control,
    register,
    getFieldState,
    formState,
    watch,
    setValue,
    resetField
  } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: fieldPath("identificationNumbers")
  });

  // On ne peut pas utiliser directement `register` pour le volume
  // car on veut pouvoir faire la conversion m3 <-> litres lorsque
  // le type est Benne (voir ci-dessous la construction des props
  // d'input pour le volume)
  const {
    field: volumeField,
    fieldState: { error: errorVolume, isTouched: isTouchedVolume }
  } = useController({
    name: fieldPath("volume"),
    control
  });

  const { error: errorType, isTouched: isTouchedType } = getFieldState(
    fieldPath("type")
  );

  const { error: errorQuantity, isTouched: isTouchedQuantity } = getFieldState(
    fieldPath("quantity")
  );
  const { error: errorOther, isTouched: isTouchedOther } = getFieldState(
    fieldPath("other")
  );

  const errors = {
    type: errorType?.message,
    volume: errorVolume?.message,
    quantity: errorQuantity?.message,
    other: errorOther?.message
  };

  // Affiche les erreurs uniquement une première
  // tentative d'envoi du formulaire
  const hasBeenSubmitted = formState.submitCount > 0;

  const touched = {
    type: isTouchedType && hasBeenSubmitted,
    volume: isTouchedVolume && hasBeenSubmitted,
    quantity: isTouchedQuantity && hasBeenSubmitted,
    other: isTouchedOther && hasBeenSubmitted
  };

  const volumeInputProps = {
    onChange: volumeField.onChange,
    onBlur: volumeField.onBlur,
    value: volumeField.value,
    name: volumeField.name,
    inputRef: volumeField.ref
  };

  const packagingType = watch(fieldPath("type"));

  if (packagingType === Packagings.Benne) {
    // Dans le cas d'une benne, on veut pouvoir afficher et saisir
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
      setValue(fieldPath("volume"), newValue, {
        shouldTouch: true,
        shouldDirty: true
      });
    };
  }

  return (
    <PackagingForm
      packaging={packaging}
      packagingsLength={packagingsLength}
      packagingTypes={packagingTypes}
      disabled={disabled}
      errors={errors}
      touched={touched}
      inputProps={{
        type: register(fieldPath("type"), {
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.value === Packagings.Autre) {
              setValue(fieldPath("other"), "", {
                shouldTouch: true,
                shouldDirty: true
              });
            } else {
              resetField(fieldPath("other"));
              setValue(fieldPath("other"), null);
            }
          }
        }),
        volume: volumeInputProps,
        quantity: register(fieldPath("quantity")),
        other: register(fieldPath("other")),
        identificationNumbers: {
          push: append,
          remove
        }
      }}
    />
  );
}

export default RhfPackagingForm;
