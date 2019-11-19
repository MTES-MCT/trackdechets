import React, { ReactNode } from "react";
import styles from "./AccountContentWrapper.module.scss";

type Props = {
  title: string;
  children: ReactNode;
};

/**
 * Wrapper component that adds a title and some padding to the content
 */
export default function AccountContentWrapper({ title, children }: Props) {
  return (
    <div className={styles.content}>
      <h5 className={styles.title}>{title}</h5>
      <div>{children}</div>
    </div>
  );
}
