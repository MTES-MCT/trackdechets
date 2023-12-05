import * as React from "react";
import { Bsff } from "codegen-ui";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription
} from "../../../../../common/components";
import { PACKAGINGS_NAMES } from "../../../../../form/bsff/components/packagings/Packagings";

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
      {bsff.packagings?.length === 1 && (
        <>
          <DataListItem>
            <DataListTerm>Code déchet</DataListTerm>
            <DataListDescription>
              {bsff.packagings[0].acceptation?.wasteCode ?? bsff.waste?.code}
            </DataListDescription>
          </DataListItem>
          <DataListItem>
            <DataListTerm>Dénomination usuelle</DataListTerm>
            <DataListDescription>
              {bsff.packagings[0].acceptation?.wasteDescription ??
                (bsff.waste?.description || "inconnue")}
            </DataListDescription>
          </DataListItem>
        </>
      )}

      {bsff.packagings?.length === 1 && (
        <DataListItem>
          <DataListTerm>Quantité de fluides</DataListTerm>
          <DataListDescription>
            {bsff.packagings[0].acceptation?.weight ?? bsff.weight?.value} kg
          </DataListDescription>
        </DataListItem>
      )}

      {bsff.packagings?.length === 1 && (
        <DataListItem>
          <DataListTerm>Contenant</DataListTerm>
          <DataListDescription>
            {bsff.packagings[0].type === "AUTRE"
              ? bsff.packagings[0].other
              : PACKAGINGS_NAMES[bsff.packagings[0].type]}{" "}
            n°
            {bsff.packagings[0].numero} (
            {bsff.packagings[0].acceptation?.weight ??
              bsff.packagings[0].weight}{" "}
            kg)
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
