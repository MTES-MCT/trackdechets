import * as React from "react";
import classNames from "classnames";
import styles from "./Breadcrumb.module.scss";

interface BreadcrumbProps {
  children: React.ReactNode;
}

export function Breadcrumb({ children }: BreadcrumbProps) {
  return <ul className={styles.Breadcrumb}>{children}</ul>;
}

interface BreadcrumbItemProps {
  variant?: "complete" | "active" | "normal";
  onClick: () => void;
  children: React.ReactNode;
}

export function BreadcrumbItem({
  variant,
  onClick,
  children,
}: BreadcrumbItemProps) {
  return (
    <li
      className={classNames(
        styles.BreadcrumbItem,
        variant === "complete"
          ? styles.BreadcrumbItemComplete
          : variant === "active"
          ? styles.BreadcrumbItemActive
          : null
      )}
      role="button"
      tabIndex={0}
      onClick={onClick}
    >
      <span className={styles.BreadcrumbItemContent}>{children}</span>
    </li>
  );
}
