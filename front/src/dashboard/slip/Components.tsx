import React from "react";
import { isoDate } from "common/datetime";
import { formatPackagings } from "./utils";
import { Packagings } from "generated/graphql/types";

export const DetailRow = ({ value, label }) => {
  if (!value) {
    return null;
  }

  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
};

export const YesNoRow = ({ value, label }) => {
  if (value === null || value === undefined) {
    return null;
  }

  return (
    <>
      <dt>{label}</dt>
      <dd>{value ? "Oui" : "Non"}</dd>
    </>
  );
};
export const DateRow = ({ value, label }) => {
  if (!value) {
    return null;
  }
  return (
    <>
      <dt>{label}</dt>
      <dd>{isoDate(value)}</dd>
    </>
  );
};
export const PackagingRow = ({
  packagings,
  numberOfPackages,
}: {
  packagings?: Packagings[];
  numberOfPackages: number | null | undefined;
}) => (
  <>
    <dt>Conditionnement</dt>
    <dd>
      {!!packagings && formatPackagings(packagings)}
      {numberOfPackages && (
        <span className="tw-ml-2">({numberOfPackages})</span>
      )}
    </dd>
  </>
);
