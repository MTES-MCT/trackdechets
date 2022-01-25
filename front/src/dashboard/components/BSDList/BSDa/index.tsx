import * as React from "react";
import { CellProps, CellValue } from "react-table";

import { CommonBsd } from "generated/graphql/types";
import { IconBSDa } from "common/components/Icons";
import { BSDaActions } from "./BSDaActions/BSDaActions";
import { useParams } from "react-router-dom";
import { ActionButtonContext } from "common/components/ActionButton";
import { WorkflowAction } from "./WorkflowAction/WorkflowAction";
import { verboseBsdStatuses } from "../../../constants";

export const COLUMNS: Record<
  string,
  {
    accessor: (bsd: CommonBsd) => CellValue;
    Cell?: React.ComponentType<CellProps<CommonBsd>>;
  }
> = {
  type: {
    accessor: () => null,
    Cell: () => <IconBSDa style={{ fontSize: "24px" }} />,
  },
  readableId: {
    accessor: bsd => bsd.id,
  },
  emitter: {
    accessor: bsd =>
      `${bsd.emitter?.company?.name ?? ""} ${
        bsd.bsda?.emitterIsPrivateIndividual ? "(particulier)" : ""
      }`,
  },
  recipient: {
    accessor: bsd => bsd?.destination?.company?.name ?? "",
  },
  waste: {
    accessor: bsd =>
      [bsd?.waste?.code, bsd?.bsda?.wasteMaterialName]
        .filter(Boolean)
        .join(" - "),
  },
  transporterCustomInfo: {
    accessor: bsd => bsd.transporter?.customInfo ?? "",
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
    Cell: ({ row }) => <BSDaActions bsd={row.original} />,
  },
};
