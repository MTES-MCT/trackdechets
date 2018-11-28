import React from "react";

const dummySlips = [
  {
    id: "S18000001",
    createdAt: '12/11/18',
    emitter: "Un déchet SAS",
    recipient: "Un collecteur SAS",
    wasteCode: "01 01 01*",
    status: "En cours"
  },
  {
    id: "S18000031",
    createdAt: '12/11/18',
    emitter: "Un déchet SAS",
    recipient: "Un  autre collecteur",
    wasteCode: "05 02 01*",
    status: "En cours"
  },
  {
    id: "S18000021",
    createdAt: '12/11/18',
    emitter: "Un déchet SAS",
    recipient: "Je traite EURL",
    wasteCode: "12 01 06*",
    status: "En cours"
  },
  {
    id: "S18000004",
    createdAt: '12/11/18',
    emitter: "Un déchet SAS",
    recipient: "Cimenterie",
    wasteCode: "01 03 01*",
    status: "En cours"
  }
];
export default function Slips() {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Numéro de bordereau</th>
          <th>Date de création</th>
          <th>Emetteur</th>
          <th>Destinataire</th>
          <th>Code déchet</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {dummySlips.map(s => (
          <tr key={s.id}>
            <td>{s.id}</td>
            <td>{s.createdAt}</td>
            <td>{s.emitter}</td>
            <td>{s.recipient}</td>
            <td>{s.wasteCode}</td>
            <td>{s.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
