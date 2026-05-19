import * as React from "react";
import { Bsff } from "@td/codegen-ui";
import {
  DsfrDataList,
  DsfrDataListItem,
  DsfrDataListTerm,
  DataListDescription
} from "../../../../common/components";
import { PACKAGINGS_NAMES } from "../../../../form/bsff/components/packagings/Packagings";

interface BsffWasteSummaryProps {
  bsff: Bsff;
}

export function BsffWasteSummary({ bsff }: BsffWasteSummaryProps) {
  return (
    <DsfrDataList>
      <DsfrDataListItem>
        <DsfrDataListTerm>BSFF n°</DsfrDataListTerm>
        <DataListDescription>{bsff.id}</DataListDescription>
      </DsfrDataListItem>
      {bsff.packagings?.length === 1 && (
        <>
          <DsfrDataListItem>
            <DsfrDataListTerm>Code déchet</DsfrDataListTerm>
            <DataListDescription>
              {bsff.packagings[0].acceptation?.wasteCode ?? bsff.waste?.code}
            </DataListDescription>
          </DsfrDataListItem>
          <DsfrDataListItem>
            <DsfrDataListTerm>Dénomination usuelle</DsfrDataListTerm>
            <DataListDescription>
              {bsff.packagings[0].acceptation?.wasteDescription ??
                (bsff.waste?.description || "inconnue")}
            </DataListDescription>
          </DsfrDataListItem>
        </>
      )}

      {bsff.packagings?.length === 1 && (
        <DsfrDataListItem>
          <DsfrDataListTerm>Quantité de fluides</DsfrDataListTerm>
          <DataListDescription>
            {bsff.packagings[0].acceptation?.weight ?? bsff.weight?.value} kg
          </DataListDescription>
        </DsfrDataListItem>
      )}

      {bsff.packagings?.length === 1 && (
        <DsfrDataListItem>
          <DsfrDataListTerm>Contenant</DsfrDataListTerm>
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
        </DsfrDataListItem>
      )}
      {bsff.packagings?.length > 1 && (
        <DsfrDataListItem>
          <DsfrDataListTerm>Nombre de contenants</DsfrDataListTerm>
          <DataListDescription>{bsff.packagings.length}</DataListDescription>
        </DsfrDataListItem>
      )}
    </DsfrDataList>
  );
}
