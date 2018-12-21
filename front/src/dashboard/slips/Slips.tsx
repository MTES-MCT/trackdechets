import React from "react";
import { DateTime } from "luxon";
import SlipActions from "./SlipActions";
import { Form } from "../../form/model";
import { Me } from "../../login/model";

const statusLabels: {[key: string]: string} = {
  DRAFT: "Brouillon",
  SEALED: "En attente d'envoi",
  SENT: "En attente de réception",
  RECEIVED: "Reçu, en attente de traitement",
  PROCESSED: "Traité"
}

type Props = { forms: Form[]; me: Me };
export default function Slips({ forms, me }: Props) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Numéro</th>
          <th>Date de création</th>
          <th>Emetteur</th>
          <th>Destinataire</th>
          <th>Code déchet</th>
          <th>Quantité</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {forms.map((s: any) => (
          <tr key={s.id}>
            <td>
              <div className="id">{s.readableId}</div>
            </td>
            <td>{DateTime.fromISO(s.createdAt).toISODate()}</td>
            <td>{s.emitter.company.name}</td>
            <td>{s.recipient.company.name}</td>
            <td>{s.wasteDetails && s.wasteDetails.code}</td>
            <td>{s.wasteDetails && `${s.wasteDetails.quantity} t`}</td>
            <td>{statusLabels[s.status]}</td>
            <td>
              <SlipActions currentUser={me} form={s} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
