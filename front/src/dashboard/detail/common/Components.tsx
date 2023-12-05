import React, { ReactNode, useMemo } from "react";
import { formatDate } from "../../../common/datetime";
import styles from "./BSDDetailContent.module.scss";

import {
  PackagingInfo,
  BsvhuTransporter,
  BsdaTransporter,
  BsdasriTransporter
} from "codegen-ui";
import { getPackagingInfosSummary } from "../../../form/bsdd/utils/packagings";
import { isForeignVat } from "shared/constants";
const nbsp = "\u00A0";
export const DetailRow = ({
  value,
  label,
  units = null,
  showEmpty = false
}: {
  value: string | number | ReactNode | undefined | null;
  label: string;
  units?: string | undefined | null;
  showEmpty?: boolean | undefined;
}) => {
  if (!value && !showEmpty) {
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

/**
 * Transporter Recepisse details overview for BSDA, BSVHU and BSDASRI
 */
export const TransporterReceiptDetails = ({
  transporter
}: {
  transporter?: BsvhuTransporter | BsdaTransporter | BsdasriTransporter | null;
}) => {
  return !isForeignVat(transporter?.company?.vatNumber!) ? (
    <div className={styles.detailGrid}>
      <YesNoRow
        value={transporter?.recepisse?.isExempted}
        label="Exemption de récépissé"
      />
      {!transporter?.recepisse?.isExempted && (
        <>
          <DetailRow
            value={transporter?.recepisse?.number}
            label="Numéro de récépissé"
            showEmpty={true}
          />
          {transporter?.recepisse?.number && (
            <>
              <DetailRow
                value={transporter?.recepisse?.department}
                label="Département"
              />
              <DateRow
                value={transporter?.recepisse?.validityLimit}
                label="Date de validité de récépissé"
              />
            </>
          )}
        </>
      )}
    </div>
  ) : null;
};
