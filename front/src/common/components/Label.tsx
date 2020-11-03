import * as React from "react";
import styles from "./Label.module.scss";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ children }: LabelProps) {
  return <label className={styles.Label}>{children}</label>;
}
