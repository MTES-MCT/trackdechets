import * as React from "react";
import { formatDate } from "../../../common/pdf";
import { Bsda } from "../../../generated/graphql/types";

type Props = { previousBsdas: Bsda[] };
export function TraceabilityTable({ previousBsdas }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Identifiant</th>
          <th>Niveau</th>
          <th>Code déchet</th>
          <th>Dénomination</th>
          <th>CAP</th>
          <th>Quantité de déchets (en T)</th>
          <th>Date de collecte</th>
        </tr>
      </thead>
      <tbody>
        {previousBsdas.map(bsda => (
          <tr>
            <td>{bsda?.id}</td>
            <td>{bsda?.type === "OTHER_COLLECTIONS" ? 1 : 2}</td>
            <td>{bsda?.waste?.code}</td>
            <td>{bsda?.waste?.materialName}</td>
            <td>{bsda?.destination?.cap}</td>
            <td>{bsda?.destination?.reception?.weight}</td>
            <td>{formatDate(bsda?.transporter?.transport?.takenOverAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
