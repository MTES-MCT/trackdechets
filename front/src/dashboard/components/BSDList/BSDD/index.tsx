import * as React from "react";
import { useParams } from "react-router";
import { Form } from "generated/graphql/types";
import { CellProps, CellValue } from "react-table";
import { ActionButtonContext } from "common/components/ActionButton";
import { BSDDActions } from "dashboard/components/BSDList/BSDD/BSDDActions/BSDDActions";
import { IconBSDD } from "common/components/Icons";
import { statusLabels } from "../../../constants";
import TransporterInfoEdit from "../TransporterInfoEdit";
import { WorkflowAction } from "./WorkflowAction";

export const COLUMNS: Record<
  string,
  {
    accessor: (form: Form) => CellValue;
    Cell?: React.ComponentType<CellProps<Form>>;
  }
> = {
  type: {
    accessor: () => null,
    Cell: () => <IconBSDD style={{ fontSize: "24px" }} />,
  },
  readableId: {
    accessor: form => {
      if (form.customId && form.customId.length) {
        return `${form.readableId} | ${form.customId}`;
      }
      return form.readableId;
    },
  },
  emitter: {
    accessor: form => form.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: form => form.stateSummary?.recipient?.name ?? "",
  },
  waste: {
    accessor: form =>
      [form.wasteDetails?.code, form.wasteDetails?.name]
        .filter(Boolean)
        .join(" "),
  },
  transporterCustomInfo: {
    accessor: form => form.stateSummary?.transporterCustomInfo ?? "",
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
        <TransporterInfoEdit
          fieldName="customInfo"
          verboseFieldName="champ libre"
          form={row.original}
        />
      </>
    ),
  },
  transporterNumberPlate: {
    accessor: form => form.stateSummary?.transporterNumberPlate ?? "",
    Cell: ({ value, row }) => (
      <>
        <span style={{ marginRight: "0.5rem" }}>{value}</span>
        <TransporterInfoEdit
          fieldName="numberPlate"
          verboseFieldName="plaque d'immatriculation"
          form={row.original}
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
          <WorkflowAction siret={siret} form={row.original} />
        </ActionButtonContext.Provider>
      );
    },
  },
  actions: {
    accessor: () => null,
    Cell: ({ row }) => <BSDDActions form={row.original} />,
  },
};
