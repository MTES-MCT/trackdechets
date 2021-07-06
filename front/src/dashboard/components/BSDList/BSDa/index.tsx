import * as React from "react";
import { CellProps, CellValue } from "react-table";

import { Bsda, BsdaStatus } from "generated/graphql/types";
import { IconBSDa } from "common/components/Icons";

const bsdaVerboseStatuses: Record<BsdaStatus, string> = {
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par le producteur",
  SIGNED_BY_WORKER: "Signé par l'entreprise de travaux",
  SENT: "Envoyé",
  PROCESSED: "Traité",
  REFUSED: "Refusé",
  AWAITING_CHILD: "En attente d'un BSD suite",
};

// Basic implementation
export const COLUMNS: Record<
  string,
  {
    accessor: (form: Bsda) => CellValue;
    Cell?: React.ComponentType<CellProps<Bsda>>;
  }
> = {
  type: {
    accessor: () => null,
    Cell: () => <IconBSDa style={{ fontSize: "24px" }} />,
  },
  readableId: {
    accessor: bsda => bsda.id,
  },
  emitter: {
    accessor: bsda => bsda.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: bsda => bsda?.destination?.company?.name ?? "",
  },
  waste: {
    accessor: bsda => bsda?.waste?.materialName ?? "",
  },
  transporterCustomInfo: {
    accessor: bsda => "", // bsda.transporter?.customInfo
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
    accessor: bsda =>
      bsda.isDraft ? "Brouillon" : bsdaVerboseStatuses[bsda["bsdaStatus"]], // unable to use dot notation because of conflicting status fields
  },
  workflow: {
    accessor: () => null,
    Cell: () => null, // not implemented yet
  },
  actions: {
    accessor: () => null,
    Cell: () => null, // not implemented yet
  },
};
