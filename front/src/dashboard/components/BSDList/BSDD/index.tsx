import * as React from "react";
import { useParams } from "react-router";
import { CommonBsd } from "generated/graphql/types";
import { CellProps, CellValue } from "react-table";
import { ActionButtonContext } from "common/components/ActionButton";

import { BSDDActions } from "dashboard/components/BSDList/BSDD/BSDDActions/BSDDActions";
import { IconBSDD } from "common/components/Icons";
import { statusLabels } from "../../../constants";
import TransporterInfoEdit from "../TransporterInfoEdit";
import { WorkflowAction } from "./WorkflowAction/WorkflowAction";

export const COLUMNS: Record<
  string,
  {
    accessor: (form: CommonBsd) => CellValue;
    Cell?: React.ComponentType<CellProps<CommonBsd>>;
  }
> = {
  type: {
    accessor: () => null,
    Cell: () => <IconBSDD style={{ fontSize: "24px" }} />,
  },
  readableId: {
    accessor: form => form.readableId,
  },
  emitter: {
    accessor: form => form.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: form =>
      form.destination?.company?.name ??
      form?.bsdd?.stateSummary?.recipientName,
  },

  waste: {
    accessor: form =>
      [form.waste?.code, form.waste?.description].filter(Boolean).join(" "),
  },
  transporterCustomInfo: {
    accessor: form => form?.bsdd?.stateSummary?.transporterCustomInfo ?? "",
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>

        <TransporterInfoEdit
          fieldName="customInfo"
          verboseFieldName="champ libre"
          bsd={row.original}
          initialValue={value}
        />
      </>
    ),
  },
  transporterNumberPlate: {
    accessor: form => form?.bsdd?.stateSummary?.transporterNumberPlate ?? "",
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
        <TransporterInfoEdit
          fieldName="numberPlate"
          verboseFieldName="plaque d'immatriculation"
          bsd={row.original}
          initialValue={value}
        />
      </>
    ),
  },
  status: {
    accessor: form => statusLabels[form.status],
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
    Cell: ({ row }) => <BSDDActions bsd={row.original} />,
  },
};
