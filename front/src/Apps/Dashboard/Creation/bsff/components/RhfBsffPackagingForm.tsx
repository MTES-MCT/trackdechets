import React from "react";
import { RenderPackagingFormProps } from "./BsffPackagingList";
import { useFormContext } from "react-hook-form";
import { BsffPackagingType, Packagings } from "@td/codegen-ui";
import BsffPackagingForm from "./BsffPackagingForm";

/**
 * Wrapper qui permet de contrôler le composant <PackagingForm /> avec React Hook Form
 */
function RhfBsffPackagingForm({
  fieldName,
  packaging,
  packagingsLength,
  packagingTypes,
  idx,
  disabled = false,
  volumeEditable = false
}: RenderPackagingFormProps & { volumeEditable?: boolean }) {
  const fieldPath = (name: string) => `${fieldName}.${idx}.${name}`;

  const { register, getFieldState, formState, setValue, resetField } =
    useFormContext();

  const { error: errorVolume, isTouched: isTouchedVolume } = getFieldState(
    fieldPath("volume")
  );

  const { error: errorType, isTouched: isTouchedType } = getFieldState(
    fieldPath("type")
  );

  const { error: errorWeight, isTouched: isTouchedWeight } = getFieldState(
    fieldPath("weight")
  );
  const { error: errorOther, isTouched: isTouchedOther } = getFieldState(
    fieldPath("other")
  );

  const { error: errorNumero, isTouched: isTouchedNumero } = getFieldState(
    fieldPath("numero")
  );

  const errors = {
    type: errorType?.message,
    volume: errorVolume?.message,
    weight: errorWeight?.message,
    numero: errorNumero?.message,
    other: errorOther?.message
  };

  // Affiche les erreurs uniquement une première
  // tentative d'envoi du formulaire
  const hasBeenSubmitted = formState.submitCount > 0;

  const touched = {
    type: isTouchedType && hasBeenSubmitted,
    volume: isTouchedVolume && hasBeenSubmitted,
    weight: isTouchedWeight && hasBeenSubmitted,
    numero: isTouchedNumero && hasBeenSubmitted,
    other: isTouchedOther && hasBeenSubmitted
  };

  const packagingType = packaging.type;

  return (
    <BsffPackagingForm
      packaging={packaging}
      packagingsLength={packagingsLength}
      packagingTypes={packagingTypes}
      volumeEditable={volumeEditable}
      disabled={disabled}
      errors={errors}
      touched={touched}
      inputProps={{
        type: {
          value: packagingType,
          ...register(fieldPath("type"), {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              if (
                event.target.value === Packagings.Autre ||
                event.target.value === BsffPackagingType.Autre
              ) {
                setValue(fieldPath("other"), "", {
                  shouldTouch: true,
                  shouldDirty: true
                });
              } else {
                resetField(fieldPath("other"));
                setValue(fieldPath("other"), null);
              }
            }
          })
        },
        volume: {
          ...register(fieldPath("volume")),
          disabled: volumeEditable ? false : disabled
        },
        weight: {
          ...register(fieldPath("weight"))
        },
        other: {
          ...register(fieldPath("other"))
        },
        numero: {
          ...register(fieldPath("numero"))
        }
      }}
    />
  );
}

export default RhfBsffPackagingForm;
