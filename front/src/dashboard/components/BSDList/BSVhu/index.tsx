import * as React from "react";
import { CellProps, CellValue } from "react-table";
import { IconBSVhu } from "common/components/Icons";

import { BSVhuActions } from "./BSVhuActions/BSVhuActions";
import { useParams } from "react-router-dom";
import { ActionButtonContext } from "common/components/ActionButton";
import { WorkflowAction } from "./WorkflowAction/WorkflowAction";
import { CommonBsd } from "generated/graphql/types";

import { verboseBsdStatuses } from "../../../constants";

// Basic implementation
export const COLUMNS: Record<
  string,
  {
    accessor: (form: CommonBsd) => CellValue;
    Cell?: React.ComponentType<CellProps<CommonBsd>>;
  }
> = {
  type: {
    accessor: () => null,
    Cell: () => <IconBSVhu style={{ fontSize: "24px" }} />,
  },
  readableId: {
    accessor: vhu => vhu.id,
  },
  emitter: {
    accessor: vhu => vhu?.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: vhu => vhu?.destination?.company?.name ?? "",
  },
  waste: {
    accessor: vhu => vhu?.waste?.code ?? "",
  },
  transporterCustomInfo: {
    accessor: () => null,
    Cell: () => null,
  },
  transporterNumberPlate: {
    accessor: () => "",
    Cell: () => null,
  },
  status: {
    accessor: vhu =>
      vhu.isDraft ? "Brouillon" : verboseBsdStatuses[vhu.status],
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
    Cell: ({ row }) => <BSVhuActions bsd={row.original} />,
  },
};
