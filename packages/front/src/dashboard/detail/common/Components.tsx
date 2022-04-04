import React, { ReactNode, useMemo } from "react";
import { formatDate } from "common/datetime";
import { PackagingInfo } from "@trackdechets/codegen/src/front.gen";
import { getPackagingInfosSummary } from "form/bsdd/utils/packagings";
const nbsp = "\u00A0";
export const DetailRow = ({
  value,
  label,
  units = null
}: {
  value: string | number | ReactNode | undefined | null;
  label: string;
  units?: string | undefined | null;
}) => {
  if (!value) {
    return null;
  }

  return (
    <>
      <dt>{label}</dt>
      <dd>
        {value}
        {!!units ? `${nbsp}${units}` : null}
      </dd>
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
  packagingInfos
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
