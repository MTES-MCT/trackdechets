import React, { ReactNode } from "react";
import { toCamelCaseVarName } from "../../../Apps/utils/utils";
import { formatDate, formatDateTime } from "../../../common/datetime";

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
