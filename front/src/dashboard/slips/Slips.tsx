import React from "react";
import { DateTime } from "luxon";
import { SlipActions, DynamicActions } from "./slips-actions/SlipActions";
import { useFormsTable } from "./use-forms-table";
import SortControl from "./SortableTableHeader";
import { statusLabels } from "../constants";

import "./Slips.scss";
import { Form } from "src/generated/graphql/types";

type Props = {
  forms: Form[];
  siret: string;
  hiddenFields?: string[];
  dynamicActions?: boolean;
  refetch?: () => void
};
export default function Slips({
  forms,
  siret,
  hiddenFields = [],
  dynamicActions = false,
  refetch
}: Props) {
  const [sortedForms, sortParams, sortBy, filter] = useFormsTable(forms);

  return (
    <table className="td-table">
      <thead>
        <tr className="td-table__head-tr">
          {hiddenFields.indexOf("readableId") === -1 && <th>Numéro</th>}

          {hiddenFields.indexOf("sentAt") === -1 && (
            <SortControl
              sortFunc={sortBy}
              fieldName="sentAt"
              sortParams={sortParams}
              caption="Date d'enlèvement"
            />
          )}

          <SortControl
            sortFunc={sortBy}
            fieldName="emitter.company.name"
            sortParams={sortParams}
            caption="Emetteur"
          />

          <SortControl
            sortFunc={sortBy}
            fieldName="stateSummary.recipient.name"
            sortParams={sortParams}
            caption="Destinataire"
          />

          <SortControl
            sortFunc={sortBy}
            fieldName="wasteDetails.code"
            sortParams={sortParams}
            caption="Déchet"
          />

          <th>Quantité</th>
          {hiddenFields.indexOf("status") === -1 && (
            <SortControl
              sortFunc={sortBy}
              fieldName="status"
              sortParams={sortParams}
              caption="Statut"
            />
          )}
          {dynamicActions && <th>Mes actions</th>}
          <th></th>
        </tr>
        <tr className=" td-table__head-tr td-table__tr--bordered">
          {hiddenFields.indexOf("readableId") === -1 && (
            <th>
              <input
                type="text"
                onChange={e => filter("readableId", e.target.value)}
                className="td-input"
                placeholder="Filtrer..."
              />
            </th>
          )}

          {hiddenFields.indexOf("sentAt") === -1 && <th></th>}
          <th>
            <input
              type="text"
              onChange={e => filter("emitter.company.name", e.target.value)}
              className="td-input"
              placeholder="Filtrer..."
            />
          </th>
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
          <th>
            <input
              type="text"
              onChange={e => filter("wasteDetails.code", e.target.value)}
              className="td-input"
              placeholder="Filtrer..."
            />
          </th>
          <th />
          {hiddenFields.indexOf("status") === -1 && <th />}
          <th />
          {dynamicActions && <th></th>}
        </tr>
      </thead>
      <tbody>
        {sortedForms.map((s: any) => (
          <tr key={s.id} className="td-table__tr--bordered">
            {hiddenFields.indexOf("readableId") === -1 && (
              <td>
                <div className="id">{s.readableId}</div>
              </td>
            )}
            {hiddenFields.indexOf("sentAt") === -1 && (
              <td>
                {!!s.sentAt && DateTime.fromISO(s.sentAt).toLocaleString()}
              </td>
            )}

            <td>{s.emitter.company?.name}</td>
            <td>{s.stateSummary.recipient?.name}</td>
            <td>
              {s.wasteDetails && (
                <>
                  <div>{s.wasteDetails.code}</div>
                  <div>{s.wasteDetails.name}</div>
                </>
              )}
            </td>
            <td>{s.stateSummary.quantity ?? "?"} t</td>
            {hiddenFields.indexOf("status") === -1 && (
              <td>{statusLabels[s.status]}</td>
            )}
            {dynamicActions && (
              <td>
                <DynamicActions siret={siret} form={s} refetch={refetch}/>
              </td>
            )}
            <td>
              <SlipActions form={s} siret={siret} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
