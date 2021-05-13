import * as React from "react";
import { useParams } from "react-router";
import { Bsd } from "generated/graphql/types";
import { ActionButtonContext } from "common/components/ActionButton";
import { BSDDActions } from "dashboard/components/BSDList/BSDD/BSDDActions/BSDDActions";
import { IconBSDD } from "common/components/Icons";
import { statusLabels } from "../../../constants";
import TransporterInfoEdit from "../TransporterInfoEdit";
import { Column } from "../columns";
import { WorkflowAction } from "./WorkflowAction";

export const COLUMNS: Record<string, Pick<Column<Bsd>, "accessor" | "Cell">> = {
  type: {
    accessor: () => null,
    Cell: () => <IconBSDD style={{ fontSize: "24px" }} />,
  },
  readableId: {
    accessor: form => (form.__typename === "Form" ? form?.readableId : ""),
  },
  emitter: {
    accessor: form => form.emitter?.company?.name ?? "",
  },
  recipient: {
    accessor: form =>
      form.__typename === "Form"
        ? form.stateSummary?.recipient?.name ?? ""
        : "",
  },
  waste: {
    accessor: form =>
      form.__typename === "Form"
        ? [form.wasteDetails?.code, form.wasteDetails?.name]
            .filter(Boolean)
            .join(" ")
        : "",
  },
  transporterCustomInfo: {
    accessor: form =>
      form.__typename === "Form"
        ? form.stateSummary?.transporterCustomInfo ?? ""
        : "",
    Cell: ({ value, row }) =>
      row.original.__typename === "Form" ? (
        <>
          <span style={{ marginRight: "0.5rem" }}>{value}</span>
          <TransporterInfoEdit
            fieldName="customInfo"
            verboseFieldName="champ libre"
            form={row.original}
          />
        </>
      ) : null,
  },
  transporterNumberPlate: {
    accessor: form =>
      form.__typename === "Form"
        ? form.stateSummary?.transporterNumberPlate ?? ""
        : "",
    Cell: ({ value, row }) =>
      row.original.__typename === "Form" ? (
        <>
          <span style={{ marginRight: "0.5rem" }}>{value}</span>
          <TransporterInfoEdit
            fieldName="numberPlate"
            verboseFieldName="plaque d'immatriculation"
            form={row.original}
          />
        </>
      ) : null,
  },
  status: {
    accessor: form => statusLabels[form.status],
  },
  workflow: {
    accessor: () => null,
    Cell: ({ row }) => {
      const { siret } = useParams<{ siret: string }>();
      return row.original.__typename === "Form" ? (
        <ActionButtonContext.Provider value={{ size: "small" }}>
          <WorkflowAction siret={siret} form={row.original} />
        </ActionButtonContext.Provider>
      ) : null;
    },
  },
  actions: {
    accessor: () => null,
    Cell: ({ row }) =>
      row.original.__typename === "Form" ? (
        <BSDDActions form={row.original} />
      ) : null,
  },
};
