import React, { ReactNode } from "react";
import styles from "./AccountContentWrapper.module.scss";

type Props = {
  title: string;
  button?: ReactNode;
  children: ReactNode;
};

/**
 * Wrapper component that adds a title and some padding to the content
 */
export default function AccountContentWrapper({
  title,
  button,
  children,
}: Props) {
  return (
    <div className={styles.content}>
      <div>{children}</div>
    </div>
  );
}
