import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";
import { DateTime } from "luxon";

export default function DateInput({
  field: { name, value, onChange, onBlur },
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label>
      {label}
      <input
        name={name}
        type="date"
        value={!value ? "" : DateTime.fromISO(value).toISODate()}
        onChange={onChange}
        onBlur={onBlur}
        {...props}
      />
    </label>
  );
}
