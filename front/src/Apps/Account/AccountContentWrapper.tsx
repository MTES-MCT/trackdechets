import React, { ReactNode } from "react";
import styles from "./AccountContentWrapper.module.scss";

type Props = {
  title: string;
  showTitle?: boolean;
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
  children,
  showTitle = false
}: Props) {
  return (
    <div className={`${styles.content}`}>
      <div className={`${styles.panelTitle}`}>
        {!showTitle && (
          <div className={styles.additional}>{additional || null}</div>
        )}
        <div className={styles.titles}>
          <h1 className={showTitle ? "fr-h3 fr-mb-n0-5v" : "fr-sr-only"}>
            {title}
          </h1>
          {subtitle && (
            <p data-testid="page-subtitle" className="fr-text">
              {subtitle}
            </p>
          )}
        </div>
        {showTitle && (
          <div className={styles.additional}>{additional || null}</div>
        )}
      </div>
      <div className={showTitle ? "fr-mt-4w" : ""}>{children}</div>
    </div>
  );
}
