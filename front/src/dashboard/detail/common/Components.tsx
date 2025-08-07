import React, { ReactNode, useMemo } from "react";
import { formatDate, formatDateTime } from "../../../common/datetime";
import styles from "./BSDDetailContent.module.scss";
import {
  PackagingInfo,
  BsvhuTransporter,
  BsdaTransporter,
  BsdasriTransporter,
  BspaohTransporter,
  BsffTransporter
} from "@td/codegen-ui";
import { getPackagingInfosSummary } from "../../../Apps/common/utils/packagingsBsddSummary";
import { isForeignVat } from "@td/constants";
import { toCamelCaseVarName } from "../../../Apps/utils/utils";
import { isDefined } from "../../../common/helper";
import { QUANTITY_NON_RENSEIGNE } from "../../../Apps/common/wordings/dashboard/wordingsDashboard";
import Tooltip from "../../../Apps/common/Components/Tooltip/Tooltip";
import { FormCompany } from "@td/codegen-ui";
import { transportModeLabels } from "../../constants";

type CompanyProps = {
  company?: FormCompany | null;
  label: string;
};
export const Company = ({ company, label }: CompanyProps) => (
  <>
    <dt>{label}</dt> <dd>{company?.name}</dd>
    <dt>Siret</dt> <dd>{company?.siret}</dd>
    <dt>Numéro de TVA</dt> <dd>{company?.vatNumber}</dd>
    <dt>Adresse</dt> <dd>{company?.address}</dd>
    <dt>Tél</dt> <dd>{company?.phone}</dd>
    <dt>Mél</dt> <dd>{company?.mail}</dd>
    <dt>Contact</dt> <dd>{company?.contact}</dd>
  </>
);

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
      <dd data-testid={toCamelCaseVarName(label)}>
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
      <dd data-testid={toCamelCaseVarName(label)}>{formatDate(value)}</dd>
    </>
  );
};
export const DateTimeRow = ({ value, label }) => {
  if (!value) {
    return null;
  }
  return (
    <>
      <dt>{label}</dt>
      <dd>{formatDateTime(value)}</dd>
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
  transporter?:
    | BsvhuTransporter
    | BsdaTransporter
    | BsdasriTransporter
    | BspaohTransporter
    | BsffTransporter
    | null;
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

export const Transporter = ({
  transporter,
  isMultiModal,
  numero
}: {
  transporter: BsdaTransporter | BsffTransporter;
  isMultiModal: boolean;
  numero: number;
}): React.JSX.Element => {
  return (
    <>
      <div className={styles.detailGrid}>
        <Company
          label={isMultiModal ? `Transporteur n°${numero}` : "Transporteur"}
          company={transporter?.company}
        />
      </div>
      <TransporterReceiptDetails transporter={transporter} />
      <div className={`${styles.detailGrid} `}>
        <DateRow
          value={transporter?.transport?.takenOverAt}
          label="Emporté le"
        />
        <DateRow
          value={transporter?.transport?.signature?.date}
          label="Signé le"
        />
        <DetailRow
          value={transporter?.transport?.signature?.author}
          label="Signé par"
        />
        <DetailRow
          value={transporter?.customInfo}
          label="Informations tranporteur"
        />
        <DetailRow
          value={
            transporter?.transport?.mode
              ? transportModeLabels[transporter.transport.mode]
              : ""
          }
          label="Mode de transport"
        />
        <DetailRow
          value={transporter?.transport?.plates?.join(", ")}
          label="Immatriculations"
        />
      </div>
    </>
  );
};

export const QuantityRow = ({
  value,
  label,
  tooltip,
  showEmpty = false
}: {
  value: string | number | ReactNode | undefined | null;
  label: string;
  tooltip?: string | undefined | null;
  showEmpty: boolean;
}) => {
  const hasValue = isDefined(value);

  if (!hasValue && !showEmpty) return null;

  return (
    <DetailRow
      value={
        hasValue ? (
          `${value} tonnes`
        ) : (
          <>
            {QUANTITY_NON_RENSEIGNE} {tooltip && <Tooltip title={tooltip} />}
          </>
        )
      }
      showEmpty={showEmpty}
      label={label}
    />
  );
};
