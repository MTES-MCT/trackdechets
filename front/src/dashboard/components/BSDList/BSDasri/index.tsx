import * as React from "react";
import { Bsdasri, BsdasriStatus } from "@td/codegen-ui";
import { IconBSDasri } from "../../../../Apps/common/Components/Icons/Icons";
import { CellProps, CellValue } from "react-table";

const dasriVerboseStatuses: Record<BsdasriStatus, string> = {
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par l'émetteur",
  SENT: "Envoyé",
  RECEIVED: "Reçu",
  PROCESSED: "Traité",
  REFUSED: "Refusé",
  AWAITING_GROUP: "En attente de regroupement"
};

const getDasriVerboseStatus = (bsdasri: Bsdasri): string => {
  if (bsdasri.isDraft) {
    return "Brouillon";
  }
  const status = bsdasri["bsdasriStatus"];

  return dasriVerboseStatuses[status];
};
// Basic implementation
export const COLUMNS: Record<
  string,
  {
    accessor: (form: Bsdasri) => CellValue;
    Cell?: React.ComponentType<CellProps<Bsdasri>>;
  }
> = {
  type: {
    accessor: dasri => dasri.type,
    Cell: ({ value }) => (
      <>
        <IconBSDasri style={{ fontSize: "24px" }} />
        {value === "GROUPING" && <span>Grp</span>}
        {value === "SYNTHESIS" && <span>Synth</span>}
      </>
    )
  },
  readableId: {
    accessor: dasri => dasri.id
  },
  emitter: {
    accessor: dasri => (
      <>
        <div>{dasri.emitter?.company?.name ?? ""}</div>
        {dasri.emitter?.pickupSite?.name && (
          <div>{dasri.emitter?.pickupSite?.name}</div>
        )}
        <div>{dasri.emitter?.company?.siret ?? ""}</div>
      </>
    )
  },
  recipient: {
    accessor: dasri => (
      <>
        <div>{dasri?.destination?.company?.name ?? ""}</div>
        <div>{dasri?.destination?.company?.siret ?? ""}</div>
      </>
    )
  },
  waste: {
    accessor: dasri => dasri["bsdasriWaste"]?.code ?? ""
  },
  transporterCustomInfo: {
    accessor: dasri => dasri.transporter?.customInfo ?? "",
    Cell: ({ value }) => <span style={{ marginRight: "0.5rem" }}>{value}</span>
  },
  transporterNumberPlate: {
    accessor: dasri => dasri.transporter?.transport?.plates ?? [],
    Cell: ({ value }) => <span> {value.join(", ")}</span>
  },
  status: {
    accessor: dasri => getDasriVerboseStatus(dasri)
  }
};
