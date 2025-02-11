import React from "react";
import { RenderPackagingFormProps } from "./PackagingList";
import { useFormContext, useFieldArray } from "react-hook-form";
import PackagingForm from "./PackagingForm";

/**
 * Wrapper qui permet de contrôler le composant <PackagingForm /> avec React Hook Form
 */
function RhfPackagingForm({
  fieldName,
  packaging,
  packagingsLength,
  idx,
  disabled = false
}: RenderPackagingFormProps) {
  const fieldPath = (name: string) => `${fieldName}.${idx}.${name}`;

  const { control, register, getFieldState, formState } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: fieldPath("identificationNumbers")
  });

  const { error: errorType, isTouched: isTouchedType } = getFieldState(
    fieldPath("type")
  );
  const { error: errorVolume, isTouched: isTouchedVolume } = getFieldState(
    fieldPath("volume")
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

  return (
    <PackagingForm
      packaging={packaging}
      packagingsLength={packagingsLength}
      disabled={disabled}
      errors={errors}
      touched={touched}
      inputProps={{
        type: register(fieldPath("type")),
        volume: register(fieldPath("volume")),
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
