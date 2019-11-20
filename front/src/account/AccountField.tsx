import React, { ReactNode } from "react";
import styles from "./AccountField.module.scss";

type Props = {
  children: ReactNode;
};

export default function AccountField({ children }: Props) {
  return <div className={styles.field}>{children}</div>;
}
