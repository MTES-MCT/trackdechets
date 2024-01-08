import React from "react";
import { BspaohPackaging } from "../../../generated/graphql/types";

const PACKAGINGS_NAMES = {
  RELIQUAIRE: "Reliquaire",
  LITTLE_BOX: "Petite boîte",
  BIG_BOX: "Grosse boîte"
};
const VERBOSE_PACKAGINGS_STATUSES = {
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  PENDING: "En atente"
};

type PackagingInfosTableProps = {
  readonly packagingInfos: BspaohPackaging[];
  readonly showAcceptation?: boolean;
};

export function PackagingInfosTable({
  packagingInfos,
  showAcceptation = false
}: PackagingInfosTableProps) {
  if (!packagingInfos) {
    return null;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>N° de ligne</th>
          <th>Type de contenant</th>
          <th>Volume (l)</th>
          <th>N° de contenant</th>
          <th>Consistance</th>
          <th>Codes d'identification des pièces</th>
          {showAcceptation && <th>Statut final</th>}
        </tr>
      </thead>
      <tbody>
        {packagingInfos.map((row, index) => (
          <tr key={row.id}>
            <td>{index + 1}</td>
            <td>{PACKAGINGS_NAMES[row.type]}</td>
            <td>{row.volume}</td>
            <td>{row.containerNumber}</td>
            <td>{row.consistence}</td>

            <td>{row.identificationCodes?.join(",")}</td>
            {showAcceptation && (
              <td>
                {VERBOSE_PACKAGINGS_STATUSES[row.acceptation ?? "PENDING"]}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
