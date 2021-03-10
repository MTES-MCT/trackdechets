import * as React from "react";
import classNames from "classnames";
import { Form } from "generated/graphql/types";
import Loader from "common/components/Loaders";
import { IconLayout2, IconLayoutModule1 } from "common/components/Icons";
import { formatDate } from "common/datetime";
import { usePersistedState } from "common/hooks/usePersistedState";
import { ITEMS_PER_PAGE, statusLabels } from "../../constants";
import { Column } from "./types";
import { BSDTable } from "./BSDTable";
import { BSDCards } from "./BSDCards";
import styles from "./BSDList.module.scss";
import TransporterInfoEdit from "./TransporterInfoEdit";

export const COLUMNS: Record<string, Column> = {
  readableId: {
    id: "readableId",
    Header: "Numéro",
    accessor: form => form.readableId,
    sortable: false,
    filterable: true,
  },
  sentAt: {
    id: "sentAt",
    Header: "Date d'enlèvement",
    accessor: form => (form.sentAt ? formatDate(form.sentAt) : ""),
    sortable: true,
    filterable: false,
  },
  emitter: {
    id: "emitter.company.name",
    Header: "Émetteur",
    accessor: form => form.emitter?.company?.name ?? "",
    sortable: true,
    filterable: true,
  },
  recipient: {
    id: "stateSummary.recipient.name",
    Header: "Destinataire",
    accessor: form => form.stateSummary?.recipient?.name ?? "",
    sortable: true,
    filterable: true,
  },
  waste: {
    id: "wasteDetails.code",
    Header: "Déchet",
    accessor: form =>
      [form.wasteDetails?.code, form.wasteDetails?.name]
        .filter(Boolean)
        .join(" "),
    sortable: true,
    filterable: true,
  },
  quantity: {
    id: "form.stateSummary.quantity",
    Header: "Quantité",
    accessor: form =>
      form.stateSummary?.quantity
        ? `${form.stateSummary?.quantity} tonnes`
        : "",
    sortable: false,
    filterable: false,
  },
  transporterCustomInfo: {
    id: "form.stateSummary.transporterCustomInfo",
    Header: "Champ libre",
    accessor: form => form.stateSummary?.transporterCustomInfo ?? "",
    sortable: false,
    filterable: false,
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
        <TransporterInfoEdit
          fieldName="customInfo"
          verboseFieldName="champ libre"
          form={row}
        />
      </>
    ),
  },
  transporterNumberPlate: {
    id: "form.stateSummary.transporterNumberPlate",
    Header: "Plaque d'immatriculation",
    accessor: form => form.stateSummary?.transporterNumberPlate ?? "",
    sortable: false,
    filterable: false,
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
        <TransporterInfoEdit
          fieldName="numberPlate"
          verboseFieldName="plaque d'immatriculation"
          form={row}
        />
      </>
    ),
  },
  status: {
    id: "status",
    Header: "Status",
    accessor: form => statusLabels[form.status],
    sortable: true,
    filterable: false,
  },
};
const DEFAULT_COLUMNS = [
  COLUMNS.readableId,
  COLUMNS.sentAt,
  COLUMNS.emitter,
  COLUMNS.recipient,
  COLUMNS.waste,
  COLUMNS.quantity,
  COLUMNS.status,
];

const LAYOUT_LOCAL_STORAGE_KEY = "td-display-type";

const LAYOUTS = [
  {
    label: (
      <>
        <IconLayout2 style={{ marginRight: "0.25rem" }} />
        Tableau
      </>
    ),
    type: "table" as const,
    Component: BSDTable,
  },
  {
    label: (
      <>
        <IconLayoutModule1 style={{ marginRight: "0.25rem" }} />
        Cartes
      </>
    ),
    type: "cards" as const,
    Component: BSDCards,
  },
];

type LayoutType = "table" | "cards";

interface BSDListProps {
  forms: Form[];
  siret: string;
  columns?: Column[];
  fetchMore: any;
  loading: boolean;
  blankslate: React.ReactNode;
}

export function BSDList({
  forms,
  siret,
  columns = DEFAULT_COLUMNS,
  fetchMore,
  loading,
  blankslate,
}: BSDListProps) {
  const [layoutType, setLayoutType] = usePersistedState<LayoutType>(
    LAYOUT_LOCAL_STORAGE_KEY,
    value => LAYOUTS.find(layout => layout.type === value)?.type ?? "table"
  );
  const currentLayout = LAYOUTS.find(layout => layout.type === layoutType)!;

  return (
    <>
      {loading && <Loader />}
      {forms.length > 0 || loading ? (
        <>
          <div className={styles.ButtonGroup} style={{ margin: "1rem" }}>
            {LAYOUTS.map(layout => (
              <button
                key={layout.type}
                type="button"
                className={classNames(
                  "btn btn--small",
                  layout.type === currentLayout.type
                    ? "btn--primary"
                    : "btn--outline-primary"
                )}
                onClick={() => setLayoutType(layout.type)}
              >
                {layout.label}
              </button>
            ))}
          </div>
          <currentLayout.Component
            siret={siret}
            forms={forms}
            columns={columns}
          />
          {forms.length >= ITEMS_PER_PAGE && (
            <div style={{ textAlign: "center" }}>
              <button
                className="center btn btn--primary small"
                onClick={() =>
                  fetchMore({
                    variables: {
                      cursorAfter: forms[forms.length - 1].id,
                    },
                    updateQuery: (prev, { fetchMoreResult }) => {
                      if (!fetchMoreResult) return prev;
                      return {
                        ...prev,
                        forms: [...prev.forms, ...fetchMoreResult.forms],
                      };
                    },
                  })
                }
              >
                Charger plus de bordereaux
              </button>
            </div>
          )}
        </>
      ) : (
        blankslate
      )}
    </>
  );
}
