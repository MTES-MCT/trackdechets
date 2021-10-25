import * as React from "react";

import { Bsdasri, BsdasriStatus } from "generated/graphql/types";
import { ActionButtonContext } from "common/components/ActionButton";
import { useParams } from "react-router";

import { IconBSDasri } from "common/components/Icons";
import { CellProps, CellValue } from "react-table";
import { BSDAsriActions } from "dashboard/components/BSDList/BSDasri/BSDasriActions/BSDasriActions";
import { WorkflowAction } from "./WorkflowAction";
const dasriVerboseStatuses: Record<BsdasriStatus, string> = {
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par le producteur",
  SENT: "Envoyé",
  RECEIVED: "Reçu",
  PROCESSED: "Traité",
  REFUSED: "Refusé",
};
// Basic implementation
export const COLUMNS: Record<
  string,
  {
    accessor: (form: Bsdasri) => CellValue;
    Cell?: React.ComponentType<CellProps<Bsdasri>>;
  }
> = {
  type: {
    accessor: dasri => dasri.type,
    Cell: ({ value }) => (
      <>
        <IconBSDasri style={{ fontSize: "24px" }} />
        {value === "GROUPING" && <span>Grp</span>}
      </>
    ),
  },
  readableId: {
    accessor: dasri => dasri.id,
  },
  emitter: {
    accessor: dasri => dasri.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: dasri => dasri?.destination?.company?.name ?? "",
  },
  waste: {
    accessor: dasri => dasri?.waste?.code,
  },
  transporterCustomInfo: {
    accessor: dasri => dasri.transporter?.customInfo ?? "",
    Cell: ({ value }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
      </>
    ),
  },
  transporterNumberPlate: {
    accessor: dasri => dasri.transporter?.transport?.plates ?? [],
    Cell: ({ value }) => (
      <>
        <span> {value.join(", ")}</span>
      </>
    ),
  },
  status: {
    accessor: dasri =>
      dasri.isDraft
        ? "Brouillon"
        : dasriVerboseStatuses[dasri["bsdasriStatus"]], // unable to use dot notation because of conflicting status fields
  },

  workflow: {
    accessor: () => null,
    Cell: ({ row }) => {
      const { siret } = useParams<{ siret: string }>();
      return (
        <ActionButtonContext.Provider value={{ size: "small" }}>
          <WorkflowAction siret={siret} form={row.original} />
        </ActionButtonContext.Provider>
      );
    },
  },
  actions: {
    accessor: () => null,
    Cell: ({ row }) => <BSDAsriActions form={row.original} />,
  },
};
