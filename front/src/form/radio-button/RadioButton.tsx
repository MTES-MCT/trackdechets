import React from "react";
import { FieldProps } from "formik";

export default function RadioButton({
  field: { name, value, onChange, onBlur },
  id,
  label,
  form
}: FieldProps & { id: string; label: string }) {
  return (
    <label className="label-inline">
      <input
        name={name}
        type="radio"
        value={id}
        checked={id === value}
        onChange={onChange}
        onBlur={onBlur}
      />
      {label}
    </label>
  );
}
