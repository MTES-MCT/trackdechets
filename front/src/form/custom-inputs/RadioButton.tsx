import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";

export default function RadioButton({
  field: { name, value, onChange, onBlur },
  id,
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="label-inline">
      <input
        name={name}
        type="radio"
        value={id}
        checked={id === value}
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
      {label}
    </label>
  );
}
