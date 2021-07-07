import * as React from "react";
import { CellProps, CellValue } from "react-table";
import { BsffStatus } from "generated/graphql/types";
import { IconBSFF } from "common/components/Icons";

const bsffVerboseStatuses: Record<BsffStatus, string> = {
  INITIAL: "Initial",
  SIGNED_BY_EMITTER: "Signé par l'émetteur",
  SENT: "Envoyé",
  RECEIVED: "Reçu",
  PROCESSED: "Traité",
  REFUSED: "Refusé",
};

export interface BsffFragment {
  id: string;
  bsffStatus: BsffStatus;
  bsffEmitter?: {
    company?: {
      name?: string;
    };
  };
  bsffDestination?: {
    company?: {
      name?: string;
    };
  };
  waste?: {
    code?: string;
    nature?: string;
  };
}

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
    Cell: () => null,
  },
  actions: {
    accessor: () => null,
    Cell: () => null,
  },
};
