import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";
import styles from "./CustomInputs.module.scss";
export function InlineRadioButton({
  field: { name, value, onChange, onBlur },
  id,
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const cssId = `id_${name}_${id}`;
  return (
    <label className={styles.labelInline} htmlFor={cssId}>
      <input
        id={cssId}
        name={name}
        type="radio"
        value={id}
        checked={id === value}
        onChange={onChange}
        onBlur={onBlur}
        className="td-radio"
        {...props}
      />

      {label}
    </label>
  );
}

export function RadioButton({
  field,
  id,
  label,
  ...props
}: FieldProps & { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <InlineRadioButton field={field} id={id} label={label} {...props} />
    </div>
  );
}
