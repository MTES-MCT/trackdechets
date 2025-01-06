import * as React from "react";
import { formatDate } from "../../../common/pdf";
import type { Bsda } from "@td/codegen-back";

type Props = { previousBsdas: Bsda[] };
export function TraceabilityTable({ previousBsdas }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Identifiant</th>
          <th>Niveau</th>
          <th>Code famille</th>
          <th>Nom du matériau</th>
          <th>CAP (exutoire)</th>
          <th>Quantité (en t)</th>
          <th>Date de collecte</th>
          <th>Exutoire prévu</th>
        </tr>
      </thead>
      <tbody>
        {previousBsdas.map(bsda => (
          <tr key={bsda.id}>
            <td>{bsda?.id}</td>
            <td>{bsda?.type === "OTHER_COLLECTIONS" ? 1 : 2}</td>
            <td>{bsda?.waste?.familyCode}</td>
            <td>{bsda?.waste?.materialName}</td>
            <td>
              {bsda?.destination?.operation?.nextDestination?.cap ??
                bsda?.destination?.cap}
            </td>
            <td>{bsda?.destination?.reception?.weight}</td>
            <td>{formatDate(bsda?.transporter?.transport?.takenOverAt)}</td>
            <td>
              {[
                bsda?.destination?.operation?.nextDestination?.company?.name,
                bsda?.destination?.operation?.nextDestination?.company?.siret
              ]
                .filter(Boolean)
                .join(" - ")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
