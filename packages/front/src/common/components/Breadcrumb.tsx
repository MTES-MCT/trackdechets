import * as React from "react";
import styles from "./Breadcrumb.module.scss";

interface BreadcrumbProps {
  children: React.ReactNode;
}

export function Breadcrumb({ children }: BreadcrumbProps) {
  return <ul className={styles.Breadcrumb}>{children}</ul>;
}

interface BreadcrumbItemProps {
  children: React.ReactNode;
}

export function BreadcrumbItem({ children }: BreadcrumbItemProps) {
  return <li className={styles.BreadcrumbItem}>{children}</li>;
}
