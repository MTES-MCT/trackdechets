import * as React from "react";
import { CellProps, CellValue } from "react-table";
import { IconBSVhu } from "../../../../Apps/common/Components/Icons/Icons";
import { Bsvhu, BsvhuStatus } from "@td/codegen-ui";

const vhuVerboseStatuses: Record<BsvhuStatus, string> = {
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par le producteur",
  SENT: "En cours d'acheminement",
  PROCESSED: "Traité",
  REFUSED: "Refusé"
};

// Basic implementation
export const COLUMNS: Record<
  string,
  {
    accessor: (form: Bsvhu) => CellValue;
    Cell?: React.ComponentType<CellProps<Bsvhu>>;
  }
> = {
  type: {
    accessor: () => null,
    Cell: () => <IconBSVhu style={{ fontSize: "24px" }} />
  },
  readableId: {
    accessor: vhu => vhu.id
  },
  emitter: {
    accessor: vhu => (
      <>
        <div>{vhu?.emitter?.company?.name ?? ""}</div>
        <div>{vhu?.emitter?.company?.siret ?? ""}</div>
      </>
    )
  },
  recipient: {
    accessor: vhu => (
      <>
        <div>{vhu?.destination?.company?.name ?? ""}</div>
        <div>{vhu?.destination?.company?.siret ?? ""}</div>
      </>
    )
  },
  waste: {
    accessor: vhu => vhu?.wasteCode
  },
  transporterCustomInfo: {
    accessor: () => null,
    Cell: () => null
  },
  transporterNumberPlate: {
    accessor: () => "",
    Cell: () => null
  },
  status: {
    accessor: vhu =>
      vhu.isDraft ? "Brouillon" : vhuVerboseStatuses[vhu["bsvhuStatus"]] // unable to use dot notation because of conflicting status fields
  }
};
