import React, { ReactNode } from "react";
import styles from "./AccountContentWrapper.module.scss";

type Props = {
  title: string;
  subtitle?: string;
  additional?: ReactNode;
  children: ReactNode;
};

/**
 * Wrapper component that adds a title and some padding to the content
 */
export default function AccountContentWrapper({
  title,
  subtitle,
  additional,
  children
}: Props) {
  return (
    <div className={`fr-container--fluid ${styles.content}`}>
      <div className={`fr-mb-4w ${styles.panelTitle}`}>
        <div className={styles.titles}>
          <h1 className="fr-h3 fr-mb-n0-5v">{title}</h1>
          {subtitle && (
            <p data-testid="page-subtitle" className="fr-text">
              {subtitle}
            </p>
          )}
        </div>
        <div className={styles.additional}>{additional || null}</div>{" "}
      </div>
      <div>{children}</div>
    </div>
  );
}
