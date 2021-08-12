import * as React from "react";
import { CellProps, CellValue } from "react-table";
import { BsffStatus } from "generated/graphql/types";
import { IconBSFF } from "common/components/Icons";
import { BsffActions } from "./BsffActions/BsffActions";
import { BsffFragment } from "./types";
import { ActionButtonContext } from "common/components/ActionButton";
import { WorkflowAction } from "./WorkflowAction";
import { useParams } from "react-router-dom";

const bsffVerboseStatuses: Record<BsffStatus, string> = {
  INITIAL: "En attente d'enlèvement",
  SIGNED_BY_EMITTER: "Signé par l'émetteur",
  SENT: "Signé par le transporteur",
  RECEIVED: "Reçu par le destinataire",
  INTERMEDIATELY_PROCESSED: "Traité, en attente de suivi",
  PROCESSED: "Traité",
  REFUSED: "Refusé par le destinataire",
};

export const COLUMNS: Record<
  string,
  {
    accessor: (bsff: BsffFragment) => CellValue;
    Cell?: React.ComponentType<CellProps<BsffFragment>>;
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
    accessor: bsff => bsff.bsffEmitter?.company?.name ?? "",
  },
  recipient: {
    accessor: bsff => bsff.bsffDestination?.company?.name ?? "",
  },
  waste: {
    accessor: bsff =>
      [bsff.waste?.code, bsff.waste?.nature].filter(Boolean).join(" "),
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
    accessor: bsff => bsffVerboseStatuses[bsff.bsffStatus],
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
    Cell: ({ row }) => <BsffActions form={row.original} />,
  },
};

export * from "./types";
