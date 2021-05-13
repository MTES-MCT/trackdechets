import * as React from "react";

import { Bsd } from "generated/graphql/types";

import { IconBSDasri } from "common/components/Icons";

import { Column } from "../columns";

// Basic implementation
export const COLUMNS: Record<string, Pick<Column<Bsd>, "accessor" | "Cell">> = {
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
    accessor: dasri =>
      dasri.__typename === "Bsdasri" ? dasri?.emission?.wasteCode : "",
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
    accessor: dasri => null,
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
      </>
    ),
  },
  status: {
    accessor: dasri =>
      dasri.__typename === "Bsdasri"
        ? dasri.isDraft
          ? "Brouillon"
          : dasri["bsdasriStatus"] // unable to use dot notation because of conflicting status fields
        : "",
  },
  workflow: {
    accessor: () => null,
    Cell: ({ row }) => null, // not implemented yet
  },
  actions: {
    accessor: () => null,
    Cell: () => <></>,
  },
};
