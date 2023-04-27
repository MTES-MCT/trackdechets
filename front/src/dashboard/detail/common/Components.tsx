import React, { ReactNode, useMemo } from "react";
import { formatDate } from "common/datetime";
import styles from "./BSDDetailContent.module.scss";

import {
  PackagingInfo,
  BsvhuTransporter,
  BsdaTransporter,
  BsdasriTransporter,
} from "generated/graphql/types";
import { getPackagingInfosSummary } from "form/bsdd/utils/packagings";
const nbsp = "\u00A0";
export const DetailRow = ({
  value,
  label,
  units = null,
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

export const TransporterRecepisseDetails = ({
  transporter,
}: {
  transporter?: BsvhuTransporter | BsdaTransporter | BsdasriTransporter | null;
}) => {
  return (
    <div className={styles.detailGrid}>
      <YesNoRow
        value={transporter?.recepisse?.isExempted}
        label="Exemption de récépissé"
      />
      <DetailRow
        value={transporter?.recepisse?.number}
        label="Numéro de récépissé"
      />
      <DetailRow
        value={transporter?.recepisse?.department}
        label="Département"
      />
      <DateRow
        value={transporter?.recepisse?.validityLimit}
        label="Date de validité de récépissé"
      />
    </div>
  );
};
