import React, { ReactNode, useState } from "react";
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
  BsvhuTrader,
  BsdaBroker
} from "@td/codegen-ui";
import { isDefined } from "../../../common/helper";
import Tooltip from "../../common/Components/Tooltip/Tooltip";

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
    <div
      className={`${separator ? "fr-mt-1w fr-pt-2w" : ""}`}
      style={
        separator
          ? {
              borderTop:
                "1px solid var(--light-border-open-blue-france, #E3E3FD)"
            }
          : {}
      }
    >
      {!!title && <h3 className="fr-h4">{title}</h3>}
      <div className={`fr-grid-row fr-grid-row--gutters fr-mb-1w`}>
        {children}
      </div>
    </div>
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
  tooltip = null,
  units = null
}: {
  label: string;
  value: string | number | ReactNode | undefined | null;
  tooltip?: string | undefined | null;
  units?: string | undefined | null;
}) => {
  return (
    <div className="fr-mb-1w">
      <div>
        {label}
        {tooltip ? <Tooltip title={tooltip} /> : null}
      </div>
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
  const displayedValue = isDefined(value) ? (value ? "Oui" : "Non") : null;
  return <PreviewTextRow label={label} value={displayedValue} />;
};

export const PreviewExpandableRow = ({ values, label }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  /* eslint-disable jsx-a11y/anchor-is-valid */

  const DEFAULT_DISPLAY_NBR = 10;

  if (!values || !values.length) {
    return <PreviewTextRow label={label} value={null} />;
  }

  if (values.length <= DEFAULT_DISPLAY_NBR) {
    return <PreviewTextRow label={label} value={<>{values.join(", ")}</>} />;
  }

  if (isExpanded) {
    return (
      <PreviewTextRow
        label={label}
        value={
          <>
            {values.join(", ")}
            <br />
            <a
              className="fr-link force-underline-link"
              href="#"
              onClick={e => {
                setIsExpanded(false);
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Voir moins...
            </a>
          </>
        }
      />
    );
  }

  return (
    <PreviewTextRow
      label={label}
      value={
        <>
          {values.slice(0, DEFAULT_DISPLAY_NBR).join(", ")}{" "}
          <i>et {values.length - DEFAULT_DISPLAY_NBR} autre(s)</i>
          <br />
          <a
            className="fr-link force-underline-link"
            href="#"
            onClick={e => {
              setIsExpanded(true);
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Voir plus...
          </a>
        </>
      }
    />
  );
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
  company,
  omitContact = false
}: {
  company?: FormCompany | BsvhuCompanyInput | null;
  omitContact?: boolean;
}) => {
  return (
    company && (
      <>
        {!omitContact && (
          <PreviewTextRow label="Contact" value={company?.contact} />
        )}

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
  actor: BsdaBroker | BsvhuBroker | BsvhuTrader | null;
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
