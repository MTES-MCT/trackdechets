import * as React from "react";
import { Bsda } from "codegen-ui";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription
} from "../../../../../common/components";
import { PACKAGINGS_NAMES } from "../../../../../form/bsda/components/packagings/Packagings";

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
      {bsda.destination?.operation?.nextDestination?.cap ? (
        <DataListItem>
          <DataListTerm>Numéro de CAP avec l'exutoire</DataListTerm>
          <DataListDescription>
            {bsda.destination?.operation?.nextDestination?.cap}
          </DataListDescription>
        </DataListItem>
      ) : (
        <DataListItem>
          <DataListTerm>Numéro de CAP</DataListTerm>
          <DataListDescription>{bsda.destination?.cap}</DataListDescription>
        </DataListItem>
      )}
      <DataListItem>
        <DataListTerm>Description</DataListTerm>
        <DataListDescription>{bsda.waste?.materialName}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code famille</DataListTerm>
        <DataListDescription>{bsda.waste?.familyCode}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Poids</DataListTerm>
        <DataListDescription>
          {bsda.destination?.reception?.weight == null ? (
            <>{bsda.weight?.value ?? 0} tonne(s)</>
          ) : (
            bsda.destination.reception.weight && <>(tonne(s))</>
          )}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Conditionnement</DataListTerm>
        <DataListDescription>
          {bsda.packagings
            ?.map(p => `${p.quantity} ${PACKAGINGS_NAMES[p.type]}`)
            .join(", ")}
        </DataListDescription>
      </DataListItem>
    </DataList>
  );
}
