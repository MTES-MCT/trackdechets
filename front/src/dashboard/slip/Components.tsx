import React, { useMemo } from "react";
import { isoDate } from "common/datetime";
import { formatPackagings } from "./utils";
import { PackagingInfo } from "generated/graphql/types";
import styles from "./Slip.module.scss";

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
  packagingInfos,
}: {
  packagingInfos?: PackagingInfo[] | null;
}) => {
  const numberOfPackages = useMemo(
    () => packagingInfos?.reduce((prev, cur) => cur.quantity + prev, 0),
    [packagingInfos]
  );
  const formatedPackagings = useMemo(
    () => formatPackagings(packagingInfos?.map(p => p.type)),
    [packagingInfos]
  );

  return (
    <>
      <dt>Conditionnement</dt>
      <dd>
        {formatedPackagings}
        {numberOfPackages && (
          <span className="tw-ml-2">({numberOfPackages})</span>
        )}
      </dd>
    </>
  );
};
