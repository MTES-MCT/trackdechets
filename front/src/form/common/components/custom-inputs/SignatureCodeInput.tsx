import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";
import "text-security/text-security-disc.css";

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
      type="text"
      pattern="[0-9]*"
      inputMode="numeric"
      className="td-input-text-security td-input"
    />
  );
}
