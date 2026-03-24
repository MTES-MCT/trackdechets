import React from "react";
import { RenderPackagingFormProps } from "./BsffPackagingList";
import { useFormContext, useController, useFieldArray } from "react-hook-form";
import BsffPackagingForm from "./BsffPackagingForm";
import {
  BsffPackagingType,
  BsffPackagingInput,
  PackagingInfoInput
} from "@td/codegen-ui";

// Type guard simplifié
function isBsffPackaging(
  p: PackagingInfoInput | BsffPackagingInput
): p is BsffPackagingInput {
  return "weight" in p;
}

function RhfBsffPackagingForm({
  fieldName,
  packaging,
  packagingsLength,
  packagingTypes,
  idx,
  disabled = false
}: RenderPackagingFormProps) {
  if (!isBsffPackaging(packaging)) {
    return null;
  }

  const fieldPath = (name: string) => `${fieldName}.${idx}.${name}`;

  const { control, register, getFieldState, formState, setValue, resetField } =
    useFormContext();

  // Controller volume (comme BSDA)
  const {
    field: volumeField,
    fieldState: { error: errorVolume, isTouched: isTouchedVolume }
  } = useController({
    name: fieldPath("volume"),
    control
  });

  const { append, remove } = useFieldArray({
    control,
    name: fieldPath("identificationNumbers")
  });

  // errors
  const { error: errorType, isTouched: isTouchedType } = getFieldState(
    fieldPath("type")
  );

  const { error: errorWeight, isTouched: isTouchedWeight } = getFieldState(
    fieldPath("weight")
  );

  const { error: errorQuantity, isTouched: isTouchedQuantity } = getFieldState(
    fieldPath("quantity")
  );
  const { error: errorOther, isTouched: isTouchedOther } = getFieldState(
    fieldPath("other")
  );

  const hasBeenSubmitted = formState.submitCount > 0;

  const errors = {
    type: errorType?.message,
    volume: errorVolume?.message,
    quantity: errorQuantity?.message,
    weight: errorWeight?.message,
    other: errorOther?.message
  };

  const touched = {
    type: isTouchedType && hasBeenSubmitted,
    volume: isTouchedVolume && hasBeenSubmitted,
    quantity: isTouchedQuantity && hasBeenSubmitted,
    weight: isTouchedWeight && hasBeenSubmitted,
    other: isTouchedOther && hasBeenSubmitted
  };

  // volume props (aligné DSFR)
  const volumeInputProps = {
    onChange: volumeField.onChange,
    onBlur: volumeField.onBlur,
    value: packaging.volume ?? "",
    name: volumeField.name,
    inputRef: volumeField.ref
  };

  return (
    <BsffPackagingForm
      packaging={packaging}
      packagingsLength={packagingsLength}
      packagingTypes={packagingTypes}
      disabled={disabled}
      errors={errors}
      touched={touched}
      inputProps={{
        type: {
          value: packaging.type ?? "",
          ...register(fieldPath("type"), {
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              const value = e.target.value;

              setValue(fieldPath("type"), value, {
                shouldDirty: true,
                shouldTouch: true
              });

              // logique AUTRE
              if (value === BsffPackagingType.Autre) {
                setValue(fieldPath("other"), "", {
                  shouldDirty: true,
                  shouldTouch: true
                });
              } else {
                resetField(fieldPath("other"));
                setValue(fieldPath("other"), null);
              }
            }
          })
        },

        volume: volumeInputProps,
        quantity: {
          value: packaging.quantity ?? "",
          ...register(fieldPath("quantity"))
        },
        identificationNumbers: {
          push: append,
          remove
        },

        weight: {
          value: packaging.weight ?? "",
          ...register(fieldPath("weight"))
        },

        other: {
          value: packaging.other ?? "",
          ...register(fieldPath("other"))
        }
      }}
    />
  );
}

export default RhfBsffPackagingForm;
