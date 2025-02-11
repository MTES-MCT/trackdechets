import React from "react";
import { RenderPackagingFormProps } from "./PackagingList";
import { useFormContext, useFieldArray } from "react-hook-form";
import PackagingForm from "./PackagingForm";

function RhfPackagingForm({
  fieldName,
  packaging,
  packagingsLength,
  idx,
  disabled = false,
  errors,
  touched
}: RenderPackagingFormProps) {
  const { control, register } = useFormContext();
  const { append, remove } = useFieldArray({
    control,
    name: `${fieldName}.${idx}.identificationNumbers`
  });

  return (
    <PackagingForm
      packaging={packaging}
      packagingsLength={packagingsLength}
      disabled={disabled}
      errors={errors}
      touched={touched}
      inputProps={{
        type: register(`${fieldName}.${idx}.type`),
        volume: register(`${fieldName}.${idx}.volume`),
        quantity: register(`${fieldName}.${idx}.quantity`),
        other: register(`${fieldName}.${idx}.other`),
        identificationNumbers: {
          push: append,
          remove
        }
      }}
    />
  );
}

export default RhfPackagingForm;
