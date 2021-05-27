import * as React from "react";

import { Bsdasri, BsdasriStatus } from "generated/graphql/types";

import { IconBSDasri } from "common/components/Icons";
import { CellProps, CellValue } from "react-table";
import { BSDAsriActions } from "dashboard/components/BSDList/BSDasri/BSDasriActions/BSDasriActions";

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
    accessor: () => null,
    Cell: () => <IconBSDasri style={{ fontSize: "24px" }} />,
  },
  readableId: {
    accessor: dasri => dasri.id,
  },
  emitter: {
    accessor: dasri => dasri.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: dasri => dasri?.recipient?.company?.name ?? "",
  },
  waste: {
    accessor: dasri => dasri?.emission?.wasteCode,
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
    accessor: () => null,
    Cell: () => null,
  },
  status: {
    accessor: dasri =>
      dasri.isDraft
        ? "Brouillon"
        : dasriVerboseStatuses[dasri["bsdasriStatus"]], // unable to use dot notation because of conflicting status fields
  },

  workflow: {
    accessor: () => null,
    Cell: () => null, // not implemented yet
  },
  actions: {
    accessor: () => null,
    Cell: ({ row }) => <BSDAsriActions form={row.original} />,
  },
};
