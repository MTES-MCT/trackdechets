import * as React from "react";
import classNames from "classnames";
import styles from "./Stepper.module.scss";

interface StepperProps {
  children: React.ReactNode;
}

export function Stepper({ children }: StepperProps) {
  return <ul className={styles.Stepper}>{children}</ul>;
}

interface StepperItemProps {
  variant?: "complete" | "active" | "normal";
  onClick: () => void;
  children: React.ReactNode;
}

export function StepperItem({ variant, onClick, children }: StepperItemProps) {
  return (
    <li
      className={classNames(
        styles.StepperItem,
        variant === "complete"
          ? styles.StepperItemComplete
          : variant === "active"
          ? styles.StepperItemActive
          : null
      )}
      role="button"
      tabIndex={0}
      onClick={onClick}
    >
      <span className={styles.StepperItemContent}>{children}</span>
    </li>
  );
}
