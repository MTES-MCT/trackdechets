import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";
import { parseDate } from "common/datetime";

export default function DateInput({
  field,
  ...props
}: FieldProps<Date | string | null> & { label: string } & InputHTMLAttributes<
    HTMLInputElement
  >) {
  const { value, ...rest } = field;

  return (
    <input
      type="date"
      value={value ? parseDate(value).toISOString() : ""}
      {...rest}
      {...props}
    />
  );
}
