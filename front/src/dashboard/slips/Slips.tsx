import React from "react";
import { DateTime } from "luxon";
import SlipActions from "./SlipActions";
import { Form } from "../../form/model";
import { Me } from "../../login/model";

type Props = { forms: Form[]; me: Me };
export default function Slips({ forms, me }: Props) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Numéro de bordereau</th>
          <th>Date de création</th>
          <th>Emetteur</th>
          <th>Destinataire</th>
          <th>Code déchet</th>
          <th>Quantité</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {forms.map((s: any) => (
          <tr key={s.id}>
            <td>
              <div className="id">{s.readableId}</div>
              <SlipActions currentUser={me} form={s} />
            </td>
            <td>{DateTime.fromISO(s.createdAt).toISODate()}</td>
            <td>{s.emitter.company.name}</td>
            <td>{s.recipient.company.name}</td>
            <td>{s.wasteDetails && s.wasteDetails.code}</td>
            <td>{s.wasteDetails && s.wasteDetails.quantity} t</td>
            <td>{s.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
