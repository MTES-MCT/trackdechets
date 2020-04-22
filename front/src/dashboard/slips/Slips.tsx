import React from "react";
import { DateTime } from "luxon";
import { SlipActions, DynamicActions } from "./SlipActions";
import { Form } from "../../form/model";
import { useFormsTable } from "./use-forms-table";
import { statusLabels } from "../constants";
import { FaSort } from "react-icons/fa";
import "./Slips.scss";

type Props = {
  forms: Form[];
  siret: string;
  hiddenFields?: string[];
  dynamicActions?: boolean;
};
export default function Slips({
  forms,
  siret,
  hiddenFields = [],
  dynamicActions = false,
}: Props) {
  const [sortedForms, sortBy, filter] = useFormsTable(forms);

  return (
    <table className="table">
      <thead>
        <tr>
          {hiddenFields.indexOf("readableId") === -1 && <th>Numéro</th>}
          <th className="sortable" onClick={() => sortBy("createdAt")}>
            Date de création{" "}
            <small>
              <FaSort />
            </small>
          </th>
          <th
            className="sortable"
            onClick={() => sortBy("emitter.company.name")}
          >
            Emetteur{" "}
            <small>
              <FaSort />
            </small>
          </th>
          <th
            className="sortable"
            onClick={() => sortBy("stateSummary.recipient.name")}
          >
            Destinataire{" "}
            <small>
              <FaSort />
            </small>
          </th>
          <th className="sortable" onClick={() => sortBy("wasteDetails.code")}>
            Déchet{" "}
            <small>
              <FaSort />
            </small>
          </th>
          <th>Quantité</th>
          {hiddenFields.indexOf("status") === -1 && (
            <th className="sortable" onClick={() => sortBy("status")}>
              Statut{" "}
              <small>
                <FaSort />
              </small>
            </th>
          )}
          {dynamicActions && <th>Mes actions</th>}
          <th></th>
        </tr>
        <tr>
          {hiddenFields.indexOf("readableId") === -1 && (
            <th>
              <input
                type="text"
                onChange={(e) => filter("readableId", e.target.value)}
                placeholder="Filtrer..."
              />
            </th>
          )}
          <th />
          <th>
            <input
              type="text"
              onChange={(e) => filter("emitter.company.name", e.target.value)}
              placeholder="Filtrer..."
            />
          </th>
          <th>
            <input
              type="text"
              onChange={(e) =>
                filter("stateSummary.recipient.name", e.target.value)
              }
              placeholder="Filtrer..."
            />
          </th>
          <th>
            <input
              type="text"
              onChange={(e) => filter("wasteDetails.code", e.target.value)}
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
          <tr key={s.id}>
            {hiddenFields.indexOf("readableId") === -1 && (
              <td>
                <div className="id">{s.readableId}</div>
              </td>
            )}
            <td>{DateTime.fromISO(s.createdAt).toLocaleString()}</td>
            <td>{s.emitter.company?.name}</td>
            <td>{s.stateSummary.recipient?.name}</td>
            <td>
              {s.wasteDetails && (
                <React.Fragment>
                  <div>{s.wasteDetails.code}</div>
                  <div>{s.wasteDetails.name}</div>
                </React.Fragment>
              )}
            </td>
            <td>{s.stateSummary.quantity ?? "?"} t</td>
            {hiddenFields.indexOf("status") === -1 && (
              <td>{statusLabels[s.status]}</td>
            )}
            {dynamicActions && (
              <td>
                <DynamicActions siret={siret} form={s} />
              </td>
            )}
            <td>
              <SlipActions form={s} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
