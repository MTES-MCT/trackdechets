import * as React from "react";
import { Bsda } from "generated/graphql/types";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription,
} from "common/components";
import { PACKAGINGS_NAMES } from "form/bsda/components/packagings/Packagings";

interface Props {
  bsda: Bsda;
}

export function BsdaWasteSummary({ bsda }: Props) {
  return (
    <DataList>
      <DataListItem>
        <DataListTerm>BSD-Amiante n°</DataListTerm>
        <DataListDescription>{bsda.id}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code déchet</DataListTerm>
        <DataListDescription>{bsda.waste?.code}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Numéro de CAP</DataListTerm>
        <DataListDescription>{bsda.destination?.cap}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Description</DataListTerm>
        <DataListDescription>
          {[bsda.waste?.materialName, bsda.waste?.familyCode, bsda.waste?.name]
            .filter(Boolean)
            .join(" / ")}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Poids</DataListTerm>
        <DataListDescription>
          {bsda.destination?.reception?.weight == null ? (
            <>{bsda.weight?.value ?? 0} tonne(s)</>
          ) : (
            <>{bsda.destination.reception.weight && <>(tonne(s))</>}</>
          )}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Conditionnement</DataListTerm>
        <DataListDescription>
          {bsda.packagings?.map(p => (
            <span key={`${p.quantity}-${p.type}`}>
              {p.quantity} {PACKAGINGS_NAMES[p.type]}
            </span>
          ))}
        </DataListDescription>
      </DataListItem>
    </DataList>
  );
}
