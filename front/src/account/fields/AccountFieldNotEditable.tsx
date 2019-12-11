import React, { ReactNode } from "react";
import styles from "./AccountField.module.scss";

type Props = {
  name: string;
  label: string;
  value: string | ReactNode | undefined;
};

export type Me = {
  name?: string;
  phone?: string;
  email?: string;
};

export default function AccountFieldNotEditable({ name, label, value }: Props) {
  const classes = [styles.field];

  return (
    <div className={classes.join(" ")}>
      <label htmlFor={name}>{label}</label>
      <div id={name} className={styles.field__value}>
        {value}
      </div>
    </div>
  );
}
