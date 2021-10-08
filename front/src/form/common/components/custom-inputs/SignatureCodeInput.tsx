import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";

type NumberInputProps = FieldProps & InputHTMLAttributes<HTMLInputElement>;
export default function SignatureCodeInput({
  field,
  ...props
}: NumberInputProps) {
  const value = field.value ?? "";

  return (
    <input
      {...field}
      value={value}
      {...props}
      type="password"
      autoComplete="off"
      pattern="[0-9]*"
      inputMode="numeric"
    />
  );
}
