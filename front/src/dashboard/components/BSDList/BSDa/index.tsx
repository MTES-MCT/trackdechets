import * as React from "react";
import { CellProps, CellValue } from "react-table";

import { Bsda, BsdaStatus } from "generated/graphql/types";
import { IconBSDa } from "common/components/Icons";
import { BSDaActions } from "./BSDaActions/BSDaActions";
import { useParams } from "react-router-dom";
import { ActionButtonContext } from "common/components/ActionButton";
import { WorkflowAction } from "./WorkflowAction/WorkflowAction";
import { TransporterInfoEdit } from "./WorkflowAction/TransporterInfoEdit";

const bsdaVerboseStatuses: Record<BsdaStatus, string> = {
  INITIAL: "Initial",
  SIGNED_BY_PRODUCER: "Signé par le producteur",
  SIGNED_BY_WORKER: "Signé par l'entreprise de travaux",
  SENT: "Envoyé",
  PROCESSED: "Traité",
  REFUSED: "Refusé",
  AWAITING_CHILD: "En attente d'un BSDA suite",
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
    accessor: bsda =>
      `${bsda.emitter?.company?.name ?? ""} ${
        bsda.emitter?.isPrivateIndividual ? "(particulier)" : ""
      }`,
  },
  recipient: {
    accessor: bsda => bsda?.destination?.company?.name ?? "",
  },
  waste: {
    accessor: bsda =>
      [bsda?.waste?.code, bsda?.waste?.materialName]
        .filter(Boolean)
        .join(" - "),
  },
  transporterCustomInfo: {
    accessor: bsda => bsda.transporter?.customInfo,
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
        <TransporterInfoEdit bsda={row.original} />
      </>
    ),
  },
  transporterNumberPlate: {
    accessor: bsda => bsda.transporter?.transport?.plates ?? [],
    Cell: ({ value, row }) => (
      <>
        <span> {value.join(", ")}</span>
        <TransporterInfoEdit bsda={row.original} />
      </>
    ),
  },
  status: {
    accessor: bsda =>
      bsda.isDraft ? "Brouillon" : bsdaVerboseStatuses[bsda["bsdaStatus"]], // unable to use dot notation because of conflicting status fields
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
    Cell: ({ row }) => <BSDaActions form={row.original} />,
  },
};
