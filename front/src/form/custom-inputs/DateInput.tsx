import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";
import { DateTime } from "luxon";

export default function DateInput({
  field, // { name, value, onChange, onBlur }
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const { value, ...rest } = field;

  return (
    <label>
      {label}
      <input
        type="date"
        value={value ? DateTime.fromISO(value).toISODate() : ""}
        {...rest}
        {...props}
      />
    </label>
  );
}
