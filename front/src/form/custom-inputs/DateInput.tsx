import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";
import { DateTime } from "luxon";

export default function DateInput({
  field, // { name, value, onChange, onBlur }
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const { value, ...rest } = field;

  const date: DateTime =
    value instanceof Date
      ? DateTime.fromJSDate(value)
      : DateTime.fromISO(value);

  return (
    <input
      type="date"
      value={value ? date.toISODate() : ""}
      {...rest}
      {...props}
    />
  );
}
