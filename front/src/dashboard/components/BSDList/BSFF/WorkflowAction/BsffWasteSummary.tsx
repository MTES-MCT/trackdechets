import * as React from "react";
import { Bsff } from "generated/graphql/types";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription,
} from "common/components";

interface BsffWasteSummaryProps {
  bsff: Bsff;
}

export function BsffWasteSummary({ bsff }: BsffWasteSummaryProps) {
  return (
    <DataList>
      <DataListItem>
        <DataListTerm>BSFF n°</DataListTerm>
        <DataListDescription>{bsff.id}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code déchet</DataListTerm>
        <DataListDescription>{bsff.waste?.code}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Nature du fluide</DataListTerm>
        <DataListDescription>
          {bsff.waste?.description || "inconnue"}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Quantité de fluides</DataListTerm>
        <DataListDescription>
          {bsff.destination?.reception?.weight == null ? (
            <>
              {bsff.weight?.value} kilo(s){" "}
              {bsff.weight?.isEstimate && <>(estimé(s))</>}
            </>
          ) : (
            <>{bsff.destination.reception.weight} kilo(s)</>
          )}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Contenant(s)</DataListTerm>
        <DataListDescription>
          {bsff.packagings
            .map(
              packaging =>
                `${packaging.name} n°${packaging.numero} (${packaging.weight} kilo(s))`
            )
            .join(", ")}
        </DataListDescription>
      </DataListItem>
    </DataList>
  );
}
