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
          {bsff.weight?.value} kilo(s){" "}
          {bsff.weight?.isEstimate && <>(estimé(s))</>}
        </DataListDescription>
      </DataListItem>
      {bsff.packagings?.length === 1 && (
        <DataListItem>
          <DataListTerm>Contenant</DataListTerm>
          <DataListDescription>
            {bsff.packagings[0].name} n°{bsff.packagings[0].numero} (
            {bsff.packagings[0].weight} kilo(s))
          </DataListDescription>
        </DataListItem>
      )}
      {bsff.packagings?.length > 1 && (
        <DataListItem>
          <DataListTerm>Nombre de contenants</DataListTerm>
          <DataListDescription>{bsff.packagings.length}</DataListDescription>
        </DataListItem>
      )}
    </DataList>
  );
}
