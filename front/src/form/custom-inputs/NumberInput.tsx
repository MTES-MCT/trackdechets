import React, { InputHTMLAttributes } from "react";
import { FieldProps } from "formik";
import classNames from "classnames";
import styles from "./NumberInput.module.scss";

type NumberInputProps = FieldProps & { label: string } & InputHTMLAttributes<
    HTMLInputElement
  > & {
    noSpin?: boolean;
  };

export default function NumberInput({
  field: { value, ...field },
  label,
  noSpin,
  ...props
}: NumberInputProps) {
  return (
    <label>
      {label}
      <input
        min="0"
        {...field}
        {...props}
        type="number"
        className={classNames(props.className, {
          [styles.NumberInputNoSpin]: noSpin,
        })}
        value={value == null ? "" : value}
      />
    </label>
  );
}
