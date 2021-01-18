import React from "react";
import { formatDate } from "common/datetime";
import { SlipActions } from "./slips-actions/SlipActions";
import { useFormsTable } from "./use-forms-table";
import SortControl from "./SortableTableHeader";
import { statusLabels } from "../constants";
import Shorten from "common/components/Shorten";
import { Form } from "generated/graphql/types";
import "./Slips.scss";
import WorkflowAction from "./slips-actions/workflow/WorkflowAction";

type Props = {
  forms: Form[];
  siret: string;
  columns: SlipsColumn[];
};

export enum SlipsColumn {
  READABLE_ID,
  SENT_AT,
  EMITTER_COMPANY_NAME,
  RECIPIENT_COMPANY_NAME,
  WASTE_DETAILS_CODE,
  QUANTITY,
  STATUS,
  WORKFLOW_ACTION,
  SLIPS_ACTIONS,
}

export default function Slips({ forms, siret, columns }: Props) {
  const [sortedForms, sortParams, sortBy, filter] = useFormsTable(forms);
  return (
    <div className="td-table-wrapper">
      <table className="td-table">
        <thead>
          <tr className="td-table__head-tr">
            {columns.includes(SlipsColumn.READABLE_ID) && <th>Numéro</th>}

            {columns.includes(SlipsColumn.SENT_AT) && (
              <SortControl
                sortFunc={sortBy}
                fieldName="sentAt"
                sortParams={sortParams}
                caption="Date d'enlèvement"
              />
            )}

            {columns.includes(SlipsColumn.EMITTER_COMPANY_NAME) && (
              <SortControl
                sortFunc={sortBy}
                fieldName="emitter.company.name"
                sortParams={sortParams}
                caption="Emetteur"
              />
            )}

            {columns.includes(SlipsColumn.RECIPIENT_COMPANY_NAME) && (
              <SortControl
                sortFunc={sortBy}
                fieldName="stateSummary.recipient.name"
                sortParams={sortParams}
                caption="Destinataire"
              />
            )}

            {columns.includes(SlipsColumn.WASTE_DETAILS_CODE) && (
              <SortControl
                sortFunc={sortBy}
                fieldName="wasteDetails.code"
                sortParams={sortParams}
                caption="Déchet"
              />
            )}

            {columns.includes(SlipsColumn.QUANTITY) && <th>Quantité</th>}

            {columns.includes(SlipsColumn.STATUS) && (
              <SortControl
                sortFunc={sortBy}
                fieldName="status"
                sortParams={sortParams}
                caption="Statut"
              />
            )}

            {columns.includes(SlipsColumn.WORKFLOW_ACTION) && (
              <th>Mes actions</th>
            )}

            {columns.includes(SlipsColumn.SLIPS_ACTIONS) && <th></th>}
          </tr>
          <tr className="td-table__head-tr td-table__tr">
            {columns.includes(SlipsColumn.READABLE_ID) && (
              <th>
                <input
                  type="text"
                  onChange={e => filter("readableId", e.target.value)}
                  className="td-input"
                  placeholder="Filtrer..."
                />
              </th>
            )}

            {columns.includes(SlipsColumn.SENT_AT) && <th></th>}

            {columns.includes(SlipsColumn.EMITTER_COMPANY_NAME) && (
              <th>
                <input
                  type="text"
                  onChange={e => filter("emitter.company.name", e.target.value)}
                  className="td-input"
                  placeholder="Filtrer..."
                />
              </th>
            )}

            {columns.includes(SlipsColumn.RECIPIENT_COMPANY_NAME) && (
              <th>
                <input
                  type="text"
                  onChange={e =>
                    filter("stateSummary.recipient.name", e.target.value)
                  }
                  className="td-input"
                  placeholder="Filtrer..."
                />
              </th>
            )}

            {columns.includes(SlipsColumn.WASTE_DETAILS_CODE) && (
              <th>
                <input
                  type="text"
                  onChange={e => filter("wasteDetails.code", e.target.value)}
                  className="td-input"
                  placeholder="Filtrer..."
                />
              </th>
            )}

            {columns.includes(SlipsColumn.QUANTITY) && <th />}
            {columns.includes(SlipsColumn.STATUS) && <th />}
            {columns.includes(SlipsColumn.WORKFLOW_ACTION) && <th></th>}
            {columns.includes(SlipsColumn.SLIPS_ACTIONS) && <th></th>}
          </tr>
        </thead>
        <tbody>
          {sortedForms.map((s: Form) => (
            <tr key={s.id} className="td-table__tr">
              {columns.includes(SlipsColumn.READABLE_ID) && (
                <td>
                  <div className="id">{s.readableId}</div>
                </td>
              )}
              {columns.includes(SlipsColumn.SENT_AT) && (
                <td>{!!s.sentAt && formatDate(s.sentAt)}</td>
              )}

              {columns.includes(SlipsColumn.EMITTER_COMPANY_NAME) && (
                <td>
                  <Shorten content={s?.emitter?.company?.name || ""} />
                </td>
              )}

              {columns.includes(SlipsColumn.RECIPIENT_COMPANY_NAME) && (
                <td>
                  <Shorten content={s?.stateSummary?.recipient?.name || ""} />
                </td>
              )}

              {columns.includes(SlipsColumn.WASTE_DETAILS_CODE) && (
                <td>
                  {s.wasteDetails && (
                    <>
                      <div>{s.wasteDetails.code}</div>
                      <div>{s.wasteDetails.name}</div>
                    </>
                  )}
                </td>
              )}
              {columns.includes(SlipsColumn.QUANTITY) && (
                <td>{s?.stateSummary?.quantity ?? "?"} t</td>
              )}

              {columns.includes(SlipsColumn.STATUS) && (
                <td>{statusLabels[s.status]}</td>
              )}
              {columns.includes(SlipsColumn.WORKFLOW_ACTION) && (
                <td>
                  <WorkflowAction siret={siret} form={s} />
                </td>
              )}
              {columns.includes(SlipsColumn.SLIPS_ACTIONS) && (
                <td>
                  <SlipActions form={s} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
