import * as React from "react";
import { useParams } from "react-router";
import {
  EmitterType,
  Form,
  Query,
  QueryCompanyPrivateInfosArgs,
} from "generated/graphql/types";
import { CellProps, CellValue } from "react-table";
import { ActionButtonContext } from "common/components/ActionButton";
import { BSDDActions } from "dashboard/components/BSDList/BSDD/BSDDActions/BSDDActions";
import { IconBSDD } from "common/components/Icons";
import { statusLabels } from "../../../constants";
import TransporterInfoEdit from "./TransporterInfoEdit";
import { WorkflowAction } from "./WorkflowAction";
import { useQuery } from "@apollo/client";
import { COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS } from "form/common/components/company/query";

export const COLUMNS: Record<
  string,
  {
    accessor: (form: Form) => CellValue;
    Cell?: React.ComponentType<CellProps<Form>>;
  }
> = {
  type: {
    accessor: bsdd => bsdd.emitter?.type,
    Cell: ({ value }) => (
      <>
        <IconBSDD style={{ fontSize: "24px" }} />
        {value === EmitterType.Appendix2 && <span>Grp</span>}
        {value === EmitterType.Appendix1 && <span>Tournée</span>}
        {value === EmitterType.Appendix1Producer && <span>Annexe 1</span>}
      </>
    ),
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
    accessor: form => (
      <>
        <div>
          {form.emitter?.company?.name ?? ""}
          {form.emitter?.isPrivateIndividual ? " (particulier)" : ""}
        </div>
        {form.emitter?.workSite?.name && (
          <div>{form.emitter?.workSite?.name}</div>
        )}
        <div>{form.emitter?.company?.siret ?? ""}</div>
        <div>
          {form.emitter?.company?.omiNumber
            ? `${form.emitter?.company?.omiNumber}`
            : ""}
        </div>
      </>
    ),
  },
  recipient: {
    accessor: form => (
      <>
        <div>{form.stateSummary?.recipient?.name ?? ""}</div>
        <div>{form.stateSummary?.recipient?.siret ?? ""}</div>
      </>
    ),
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
      const { data } = useQuery<
        Pick<Query, "companyPrivateInfos">,
        QueryCompanyPrivateInfosArgs
      >(COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS, {
        variables: { clue: siret },
      });
      const siretsWithAutomaticSignature = data
        ? data.companyPrivateInfos.receivedSignatureAutomations.map(
            automation => automation.from.siret
          )
        : [];

      const form = row.original;
      return (
        <ActionButtonContext.Provider value={{ size: "small" }}>
          <WorkflowAction
            siret={siret}
            form={form}
            options={{
              canSkipEmission:
                form.emitter?.type === EmitterType.Appendix1Producer &&
                (Boolean(form.ecoOrganisme?.siret) ||
                  siretsWithAutomaticSignature.includes(
                    form.emitter?.company?.siret
                  ) ||
                  Boolean(form.emitter?.isPrivateIndividual)),
            }}
          />
        </ActionButtonContext.Provider>
      );
    },
  },
  actions: {
    accessor: () => null,
    Cell: ({ row }) => <BSDDActions form={row.original} />,
  },
};
