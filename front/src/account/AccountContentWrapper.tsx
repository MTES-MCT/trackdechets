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
  children
}: Props) {
  return (
    <div className={styles.content}>
      <div className={styles.panelTitle}>
        <h5 className="h3 tw-font-bold tw-mb-8">{title}</h5>
        {button || null}
      </div>
      <div>{children}</div>
    </div>
  );
}
