import * as React from "react";
import { CellProps, CellValue } from "react-table";
import { IconBSFF } from "common/components/Icons";
import { BsffActions } from "./BsffActions/BsffActions";
import { BsffFragment } from "./types";
import { ActionButtonContext } from "common/components/ActionButton";
import { WorkflowAction } from "./WorkflowAction";
import { useParams } from "react-router-dom";
import { bsffVerboseStatuses } from "form/bsff/utils/constants";

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
    accessor: bsff => {
      if (bsff.packagings?.length) {
        return (
          <>
            <div>{bsff.id}</div>
            <div>
              {bsff.packagings
                .map(p => p.numero)
                .filter(n => n?.length > 0)
                .join(" | ")}
            </div>
          </>
        );
      }
      return bsff.id;
    },
  },
  emitter: {
    accessor: bsff => (
      <>
        <div>{bsff.bsffEmitter?.company?.name ?? ""}</div>
        <div>{bsff.bsffEmitter?.company?.siret ?? ""}</div>
      </>
    ),
  },
  recipient: {
    accessor: bsff => (
      <>
        <div>{bsff.bsffDestination?.company?.name ?? ""}</div>
        <div>{bsff.bsffDestination?.company?.siret ?? ""}</div>
      </>
    ),
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
      bsff.isDraft ? "Brouillon" : bsffVerboseStatuses[bsff.bsffStatus],
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
