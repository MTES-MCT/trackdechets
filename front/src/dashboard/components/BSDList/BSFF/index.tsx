import * as React from "react";
import { CellProps, CellValue } from "react-table";
import { IconBSFF } from "common/components/Icons";
import { BsffActions } from "./BsffActions/BsffActions";

import { ActionButtonContext } from "common/components/ActionButton";
import { WorkflowAction } from "./WorkflowAction/WorkflowAction";
import { useParams } from "react-router-dom";

import { CommonBsd } from "generated/graphql/types";
import { verboseBsdStatuses } from "../../../constants";

export const COLUMNS: Record<
  string,
  {
    accessor: (bsff: CommonBsd) => CellValue;
    Cell?: React.ComponentType<CellProps<CommonBsd>>;
  }
> = {
  type: {
    accessor: () => null,
    Cell: () => <IconBSFF style={{ fontSize: "24px" }} />,
  },
  readableId: {
    accessor: bsff => bsff.id,
  },
  emitter: {
    accessor: bsff => bsff.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: bsff => bsff.destination?.company?.name ?? "",
  },
  waste: {
    accessor: bsff =>
      [bsff.waste?.code, bsff.waste?.description].filter(Boolean).join(" "),
  },
  transporterCustomInfo: {
    accessor: () => null,
    Cell: () => null,
  },
  transporterNumberPlate: {
    accessor: () => null,
    Cell: () => null,
  },
  status: {
    accessor: bsff =>
      bsff.isDraft ? "Brouillon" : verboseBsdStatuses[bsff.status],
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
    Cell: ({ row }) => <BsffActions bsd={row.original} />,
  },
};

export * from "./types";
