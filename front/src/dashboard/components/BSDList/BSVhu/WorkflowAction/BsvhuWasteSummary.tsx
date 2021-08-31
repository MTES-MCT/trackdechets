import * as React from "react";
import { Bsvhu } from "generated/graphql/types";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription,
} from "common/components";

interface Props {
  bsvhu: Bsvhu;
}

export function BsvhuWasteSummary({ bsvhu }: Props) {
  return (
    <DataList>
      <DataListItem>
        <DataListTerm>BS-VHU n°</DataListTerm>
        <DataListDescription>{bsvhu.id}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code déchet</DataListTerm>
        <DataListDescription>{bsvhu.wasteCode}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Numéro de lots</DataListTerm>
        <DataListDescription>
          {bsvhu.identification?.numbers?.join(", ") || "Non renseigné"}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Nombre & poids</DataListTerm>
        <DataListDescription>
          {bsvhu.destination?.reception?.quantity?.number == null ? (
            <>
              {bsvhu.quantity?.number ?? 0} unité(s){" "}
              {bsvhu.quantity?.tons && <>(tonne(s))</>}
            </>
          ) : (
            <>
              {bsvhu.destination.reception.quantity.number} unité(s){" "}
              {bsvhu.destination.reception.quantity?.tons && <>(tonne(s))</>}
            </>
          )}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Conditionnement</DataListTerm>
        <DataListDescription>{bsvhu.packaging}</DataListDescription>
      </DataListItem>
    </DataList>
  );
}
