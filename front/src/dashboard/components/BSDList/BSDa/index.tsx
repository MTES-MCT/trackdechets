import * as React from "react";
import { CellProps, CellValue } from "react-table";

import { Bsda, BsdaStatus, BsdaType } from "@td/codegen-ui";
import { IconBSDa } from "../../../../Apps/common/Components/Icons/Icons";
import { TransporterInfoEdit } from "./WorkflowAction/TransporterInfoEdit";

const bsdaVerboseStatuses: Record<BsdaStatus, string> = {
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par le producteur",
  SIGNED_BY_WORKER: "Signé par l'entreprise de travaux",
  SENT: "Envoyé",
  PROCESSED: "Traité",
  REFUSED: "Refusé",
  AWAITING_CHILD: "En attente d'un BSDA suite",
  CANCELED: "Annulé"
};

export const COLUMNS: Record<
  string,
  {
    accessor: (form: Bsda) => CellValue;
    Cell?: React.ComponentType<CellProps<Bsda>>;
  }
> = {
  type: {
    accessor: bsda => bsda["bsdaType"],
    Cell: ({ value }) => (
      <>
        <IconBSDa style={{ fontSize: "24px" }} />
        {value === BsdaType.Gathering && <span>Grp</span>}
        {value === BsdaType.Reshipment && <span>Transit</span>}
      </>
    )
  },
  readableId: {
    accessor: bsda => bsda.id
  },
  emitter: {
    accessor: bsda => (
      <>
        <div>
          {bsda.emitter?.company?.name ?? ""}
          {bsda.emitter?.isPrivateIndividual ? " (particulier)" : ""}
        </div>
        {bsda.emitter?.pickupSite?.name && (
          <div>{bsda.emitter?.pickupSite?.name}</div>
        )}
        <div>{bsda.emitter?.company?.siret}</div>
      </>
    )
  },
  recipient: {
    accessor: bsda => (
      <>
        <div>{bsda?.destination?.company?.name ?? ""}</div>
        <div>{bsda?.destination?.company?.siret ?? ""}</div>
      </>
    )
  },
  waste: {
    accessor: bsda =>
      [bsda?.waste?.["bsdaCode"], bsda?.waste?.materialName]
        .filter(Boolean)
        .join(" - ")
  },
  transporterCustomInfo: {
    accessor: bsda => bsda.transporter?.customInfo,
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
        <TransporterInfoEdit bsda={row.original} />
      </>
    )
  },
  transporterNumberPlate: {
    accessor: bsda => bsda.transporter?.transport?.plates ?? [],
    Cell: ({ value, row }) => (
      <>
        <span> {value.join(", ")}</span>
        <TransporterInfoEdit bsda={row.original} />
      </>
    )
  },
  status: {
    accessor: bsda => {
      if (bsda.isDraft) return "Brouillon";
      const status = bsda["bsdaStatus"];

      if (
        status === BsdaStatus.AwaitingChild &&
        (bsda.forwardedIn || bsda.groupedIn)
      )
        return "Annexé à un bordereau suite.";
      return bsdaVerboseStatuses[status];
    }
  }
};
