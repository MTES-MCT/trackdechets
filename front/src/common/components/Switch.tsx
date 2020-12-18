import { FieldProps } from "formik";
import React from "react";
import ReactSwitch, { ReactSwitchProps } from "react-switch";
import styles from "./Switch.module.scss";

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

// Compatilibty layer between the Switch and Formik's <Field />
export function FieldSwitch({
  field: { checked, onChange, ...field },
  ...props
}: FieldSwitchProps) {
  return (
    <Switch
      {...field}
      {...props}
      onChange={(checked, event) => onChange(event)}
      checked={Boolean(checked)}
    />
  );
}
