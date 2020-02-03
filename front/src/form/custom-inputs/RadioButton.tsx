import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";

export function InlineRadioButton({
  field: { name, value, onChange, onBlur },
  id,
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const cssId = `id_${name}_${id}`;
  return (
    <p>
      <label className="label-inline mr-2" htmlFor={cssId}>
        <input
          id={cssId}
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
    </p>
  );
}

export function RadioButton({
  field,
  id,
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <p>
      <InlineRadioButton field={field} id={id} label={label} {...props} />
    </p>
  );
}
