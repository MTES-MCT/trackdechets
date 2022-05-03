import { FieldProps } from "formik";
import React from "react";
import RS, { ReactSwitchProps } from "react-switch";
import styles from "./Switch.module.scss";

// Fix for Rollup ESM-CJS interop with Vite
// cf https://github.com/vitejs/vite/issues/2139
const ReactSwitch = (RS as any).default
  ? ((RS as any).default as typeof RS)
  : RS;

interface SwitchProps extends ReactSwitchProps {
  label: string;
}

export default function Switch({ label, ...props }: SwitchProps) {
  return (
    <label>
      <ReactSwitch
        {...props}
        uncheckedIcon={false}
        checkedIcon={false}
        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
        activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
        height={12}
        width={30}
        handleDiameter={20}
        className={styles.Switch}
      />
      <span>{label}</span>
    </label>
  );
}

type FieldSwitchProps = FieldProps & {
  label: string;
};

// Compatibility layer between the Switch and Formik's <Field />
export function FieldSwitch({
  field: { checked, ...field },
  form: { setFieldValue },
  ...props
}: FieldSwitchProps) {
  return (
    <Switch
      {...field}
      {...props}
      onChange={checked => {
        setFieldValue(field.name, checked);
      }}
      checked={Boolean(checked)}
    />
  );
}
