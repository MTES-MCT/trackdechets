import React from "react";
import { isoDate } from "src/common/datetime";
import { formatPackagings } from "./utils";
import { Packagings, } from "src/generated/graphql/types";
import styles from  "./Slip.module.scss";

export const DetailRow = ({ value, label }) => {
  if (!value) {
    return null;
  }

  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
};

export const YesNoRow = ({ value, label }) => {
  if (value === null || value === undefined) {
    return null;
  }

  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value ? "Oui" : "Non"}</dd>
    </div>
  );
};
export const DateRow = ({ value, label }) => {
  if (!value) {
    return null;
  }
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{isoDate(value)}</dd>
    </div>
  );
};
export const PackagingRow = ({
  packagings,
  numberOfPackages,
}: {
  packagings?: Packagings[];
  numberOfPackages: number|null|undefined;
}) => (
  <div className={styles.detailRow}>
    <dt>Conditionnement</dt>
    <dd>
      {!!packagings && formatPackagings(packagings)}
      {numberOfPackages && (
        <span className="tw-ml-2">({numberOfPackages})</span>
      )}
    </dd>
  </div>
);
