import React, { ReactNode } from "react";
import { toCamelCaseVarName } from "../../../Apps/utils/utils";
import { formatDate, formatDateTime } from "../../../common/datetime";
import { isForeignVat } from "@td/constants";
import {
  BsvhuTransporter,
  BsdaTransporter,
  BsdasriTransporter,
  BspaohTransporter,
  BsffTransporter,
  FormCompany,
  BsvhuCompanyInput,
  BsvhuBroker,
  BsvhuTrader
} from "@td/codegen-ui";

export const PreviewContainer = ({ children }) => {
  return <div className="fr-container--fluid">{children}</div>;
};

export const PreviewContainerRow = ({
  title,
  separator = false,
  children
}: {
  title?: string | undefined | null;
  separator?: boolean;
  children: ReactNode;
}) => {
  return (
    <>
      {!!title && <h3 className="fr-h4">{title}</h3>}
      <div
        className={`fr-grid-row fr-grid-row--gutters ${
          separator ? "fr-mt-2w" : ""
        }`}
        style={
          separator
            ? {
                borderTop:
                  "1px solid var(--light-border-open-blue-france, #E3E3FD)"
              }
            : {}
        }
      >
        {children}
      </div>
    </>
  );
};

export const PreviewContainerCol = ({
  title,
  gridWidth,
  highlight = false,
  children
}: {
  title?: string | undefined | null;
  gridWidth?: number | undefined | null;
  highlight?: boolean;
  children: ReactNode;
}) => {
  return (
    <div
      className={!!gridWidth ? "fr-col-12 fr-col-md-" + gridWidth : "fr-col"}
      style={{
        borderLeft: highlight
          ? "1px solid var(--light-border-open-blue-france, #E3E3FD)"
          : "none"
      }}
    >
      {!!title ? <h4 className="fr-h6">{title}</h4> : null}
      {children}
    </div>
  );
};

const nbsp = "\u00A0";
export const PreviewTextRow = ({
  label,
  value,
  units = null
}: {
  label: string;
  value: string | number | ReactNode | undefined | null;
  units?: string | undefined | null;
}) => {
  return (
    <div className="fr-mb-1w">
      <div>{label}</div>
      <div className="fr-text--bold" data-testid={toCamelCaseVarName(label)}>
        {!!value ? (!!units ? `${value}${nbsp}${units}` : value) : "-"}
      </div>
    </div>
  );
};

export const PreviewDateRow = ({ value, label }) => {
  return <PreviewTextRow label={label} value={formatDate(value)} />;
};

export const PreviewDateTimeRow = ({ value, label }) => {
  return <PreviewTextRow label={label} value={formatDateTime(value)} />;
};

export const PreviewBooleanRow = ({ value, label }) => {
  return <PreviewTextRow label={label} value={value ? "Oui" : "Non"} />;
};

export const PreviewTransporterReceiptDetails = ({
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
  return !isForeignVat(transporter?.company?.vatNumber) &&
    transporter?.recepisse?.isExempted ? (
    <PreviewBooleanRow
      label="Exemption de récépissé"
      value={transporter.recepisse.isExempted}
    />
  ) : (
    <>
      <PreviewTextRow
        label="Récépissé n°"
        value={transporter?.recepisse?.number}
      />

      <PreviewTextRow
        label="Récépissé département"
        value={transporter?.recepisse?.department}
      />

      <PreviewDateRow
        label="Récépissé valable jusqu'au"
        value={transporter?.recepisse?.validityLimit}
      />
    </>
  );
};

export const PreviewCompanyContact = ({
  company
}: {
  company?: FormCompany | BsvhuCompanyInput | null;
}) => {
  return (
    company && (
      <>
        <PreviewTextRow label="Contact" value={company?.contact} />

        <PreviewTextRow label="Téléphone" value={company?.phone} />

        <PreviewTextRow label="Courriel" value={company?.mail} />
      </>
    )
  );
};

export const PreviewActor = ({
  actor,
  title
}: {
  actor: BsvhuBroker | BsvhuTrader | null;
  title: string;
}) => {
  return (
    actor && (
      <PreviewContainerRow title={title}>
        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow label="Raison sociale" value={actor?.company?.name} />

          <PreviewTextRow label="Siret" value={actor?.company?.siret} />

          <PreviewTextRow label="Adresse" value={actor?.company?.address} />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewCompanyContact company={actor.company} />
        </PreviewContainerCol>

        {actor?.recepisse && (
          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow
              label="Récépissé n°"
              value={actor?.recepisse?.number}
            />

            <PreviewTextRow
              label="Récépissé département"
              value={actor?.recepisse?.department}
            />

            <PreviewDateRow
              label="Récépissé valable jusqu'au"
              value={actor?.recepisse?.validityLimit}
            />
          </PreviewContainerCol>
        )}
      </PreviewContainerRow>
    )
  );
};
