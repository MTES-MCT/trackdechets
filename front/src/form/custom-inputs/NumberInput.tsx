import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";

export default function NumberInput({
  field: { name, value, onChange, onBlur },
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label>
      {label}
      <input
        name={name}
        type="number"
        value={!value && value !== 0 ? "" : value}
        onChange={onChange}
        onBlur={onBlur}
        min="0"
        {...props}
      />
    </label>
  );
}
