import * as React from "react";
import classNames from "classnames";
import styles from "./DsfrJourney.module.scss";

interface DsfrJourneyProps {
  children: React.ReactNode;
}

export function DsfrJourney({ children }: Readonly<DsfrJourneyProps>) {
  return <ul className={styles.Journey}>{children}</ul>;
}

interface DsfrJourneyStopProps {
  variant?: "complete" | "active" | "incomplete";
  children: React.ReactNode;
}

export function DsfrJourneyStop({
  variant,
  children
}: Readonly<DsfrJourneyStopProps>) {
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

interface DsfrJourneyStopNameProps {
  children: React.ReactNode;
}

export function DsfrJourneyStopName({
  children
}: Readonly<DsfrJourneyStopNameProps>) {
  return <span className={styles.JourneyStopName}>{children}</span>;
}

interface DsfrJourneyStopDescriptionProps {
  children: React.ReactNode;
}

export function DsfrJourneyStopDescription({
  children
}: Readonly<DsfrJourneyStopDescriptionProps>) {
  return <p className={styles.JourneyStopDescription}>{children}</p>;
}
