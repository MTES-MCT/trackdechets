import React from "react";
import { DateTime } from "luxon";
import SlipActions from "./SlipActions";
import { Form } from "../../form/model";
import { Me } from "../../login/model";

const statusLabels: { [key: string]: string } = {
  DRAFT: "Brouillon",
  SEALED: "En attente d'envoi",
  SENT: "En attente de réception",
  RECEIVED: "Reçu, en attente de traitement",
  PROCESSED: "Traité",
  AWAITING_GROUP: "Traité, en attente de regroupement",
  GROUPED: "Traité, annexé à un bordereau de regroupement",
  NO_TRACEABILITY: "Regroupé, avec autorisation de perte de traçabilité"
};

type Props = { forms: Form[]; me: Me; hiddenFields?: string[] };
export default function Slips({ forms, me, hiddenFields = [] }: Props) {
  return (
    <table className="table">
      <thead>
        <tr>
          {hiddenFields.indexOf("readableId") === -1 && <th>Numéro</th>}
          <th>Date de création</th>
          <th>Emetteur</th>
          <th>Destinataire</th>
          <th>Déchet</th>
          <th>Quantité</th>
          {hiddenFields.indexOf("status") === -1 && <th>Statut</th>}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {forms.map((s: any) => (
          <tr key={s.id}>
            {hiddenFields.indexOf("readableId") === -1 && (
              <td>
                <div className="id">{s.readableId}</div>
              </td>
            )}
            <td>{DateTime.fromISO(s.createdAt).toLocaleString()}</td>
            <td>{s.emitter.company && s.emitter.company.name}</td>
            <td>{s.recipient.company && s.recipient.company.name}</td>
            <td>
              {s.wasteDetails && (
                <React.Fragment>
                  <div>{s.wasteDetails.code}</div>
                  <div>{s.wasteDetails.name}</div>
                </React.Fragment>
              )}
            </td>
            <td>
              {s.wasteDetails &&
                `${s.quantityReceived || s.wasteDetails.quantity || "?"} t`}
            </td>
            {hiddenFields.indexOf("status") === -1 && (
              <td>{statusLabels[s.status]}</td>
            )}
            <td>
              <SlipActions currentUser={me} form={s} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
