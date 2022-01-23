import * as React from "react";

import { CommonBsd } from "generated/graphql/types";
import { ActionButtonContext } from "common/components/ActionButton";
import { verboseBsdStatuses } from "dashboard/constants";
import { useParams } from "react-router";

import { IconBSDasri } from "common/components/Icons";
import { CellProps, CellValue } from "react-table";

import { WorkflowAction } from "./WorkflowAction";
import { BSDAsriActions } from "dashboard/components/BSDList/BSDasri/BSDasriActions/BSDasriActions";

export const COLUMNS: Record<
  string,
  {
    accessor: (form: CommonBsd) => CellValue;
    Cell?: React.ComponentType<CellProps<CommonBsd>>;
  }
> = {
  type: {
    accessor: bsd => bsd?.bsdasri?.type,
    Cell: ({ value }) => (
      <>
        <IconBSDasri style={{ fontSize: "24px" }} />

        {value === "GROUPING" && <span>Grp</span>}
      </>
    ),
  },
  readableId: {
    accessor: bsd => bsd.id,
  },
  emitter: {
    accessor: bsd => bsd.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: bsd => bsd?.destination?.company?.name ?? "",
  },
  waste: {
    accessor: bsd => bsd?.waste?.code ?? "",
  },
  transporterCustomInfo: {
    accessor: bsd => bsd?.transporter?.customInfo ?? "",
    Cell: ({ value }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
      </>
    ),
  },
  transporterNumberPlate: {
    accessor: bsd => bsd?.transporter?.numberPlate ?? [],
    Cell: ({ value }) => (
      <>
        <span> {value.join(", ")}</span>
      </>
    ),
  },
  status: {
    accessor: bsd =>
      bsd.isDraft ? "Brouillon" : verboseBsdStatuses[bsd.status],
  },

  workflow: {
    accessor: () => null,
    Cell: ({ row }) => {
      const { siret } = useParams<{ siret: string }>();
      return (
        <ActionButtonContext.Provider value={{ size: "small" }}>
          <WorkflowAction siret={siret} bsd={row.original} />
        </ActionButtonContext.Provider>
      );
    },
  },
  actions: {
    accessor: () => null,
    Cell: ({ row }) => <BSDAsriActions bsd={row.original} />,
  },
};
