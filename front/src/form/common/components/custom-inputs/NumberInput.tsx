import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";

type NumberInputProps = FieldProps & { label: string } & InputHTMLAttributes<
    HTMLInputElement
  >;

export default function NumberInput({
  field,
  label,
  ...props
}: NumberInputProps) {
  const value = field.value ?? "";

  return (
    <label>
      {label}
      <input
        min="0"
        {...field}
        value={value}
        {...props}
        type="number"
        className={props.className}
      />
    </label>
  );
}
