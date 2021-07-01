import * as React from "react";
import { CellProps, CellValue } from "react-table";
import { IconBSFF } from "common/components/Icons";

export interface BsffFragment {
  id: string;
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
    accessor: bsff => null,
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
