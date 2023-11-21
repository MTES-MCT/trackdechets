import * as React from "react";
import classNames from "classnames";
import styles from "./Journey.module.scss";

interface JourneyProps {
  children: React.ReactNode;
}

export function Journey({ children }: JourneyProps) {
  return <ul className={styles.Journey}>{children}</ul>;
}

interface JourneyStopProps {
  variant?: "complete" | "active" | "incomplete";
  children: React.ReactNode;
}

export function JourneyStop({ variant, children }: JourneyStopProps) {
  return (
    <li
      className={classNames(styles.JourneyStop, {
        [styles.JourneyStopComplete]: variant === "complete",
        [styles.JourneyStopActive]: variant === "active"
      })}
    >
      {children}
    </li>
  );
}

interface JourneyStopNameProps {
  children: React.ReactNode;
}

export function JourneyStopName({ children }: JourneyStopNameProps) {
  return <strong className={styles.JourneyStopName}>{children}</strong>;
}

interface JourneyStopDescriptionProps {
  children: React.ReactNode;
}

export function JourneyStopDescription({
  children
}: JourneyStopDescriptionProps) {
  return <p>{children}</p>;
}
