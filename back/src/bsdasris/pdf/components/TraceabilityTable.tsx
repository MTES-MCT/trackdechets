import * as React from "react";

import { formatDate } from "../../../common/pdf";

export function TraceabilityTable({ previousBsdasris }) {
  return (
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Identifiant</th>
          <th>Nbre de contenants</th>
          <th>Volume Associé</th>
          <th>Quantité de déchets (en kg)</th>
          <th>Date de collecte initiale</th>
          <th>Code postal du lieu de collecte</th>
        </tr>
      </thead>
      <tbody>
        {previousBsdasris.map((bsdasri, idx) => (
          <tr key={idx}>
            <td>{idx + 1}</td>
            <td>{bsdasri?.id}</td>
            <td>{bsdasri?.quantity}</td>
            <td>{bsdasri?.volume}</td>
            <td>{bsdasri?.weight || "Pesée non effectuée"}</td>
            <td>{formatDate(bsdasri?.takenOverAt)}</td>
            <td>{bsdasri?.postalCode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
