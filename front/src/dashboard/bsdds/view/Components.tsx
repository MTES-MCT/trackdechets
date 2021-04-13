import React, { useMemo } from "react";
import { formatDate } from "common/datetime";
import { PackagingInfo } from "generated/graphql/types";
import { getPackagingInfosSummary } from "form/bsdd/utils/packagings";

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
      <dd>{formatDate(value)}</dd>
    </>
  );
};
export const PackagingRow = ({
  packagingInfos,
}: {
  packagingInfos?: PackagingInfo[] | null;
}) => {
  const formatedPackagings = useMemo(
    () => (packagingInfos ? getPackagingInfosSummary(packagingInfos) : ""),
    [packagingInfos]
  );

  return (
    <>
      <dt>Conditionnement</dt>
      <dd>{formatedPackagings}</dd>
    </>
  );
};
