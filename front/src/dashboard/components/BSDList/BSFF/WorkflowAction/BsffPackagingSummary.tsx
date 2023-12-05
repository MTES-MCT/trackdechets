import * as React from "react";
import { Bsff, BsffPackaging } from "codegen-ui";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription
} from "../../../../../common/components";

interface BsffPackagingSummaryProps {
  bsff: Bsff;
  packaging: BsffPackaging;
}

export function BsffPackagingSummary({
  bsff,
  packaging
}: BsffPackagingSummaryProps) {
  return (
    <DataList>
      <DataListItem>
        <DataListTerm>BSFF n°</DataListTerm>
        <DataListDescription>{bsff.id}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Contenant n°</DataListTerm>
        <DataListDescription>{packaging.numero}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code déchet</DataListTerm>
        <DataListDescription>
          {packaging?.acceptation?.wasteCode ?? bsff.waste?.code}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Nature du fluide</DataListTerm>
        <DataListDescription>
          {packaging?.acceptation?.wasteDescription ??
            (bsff.waste?.description || "inconnue")}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Quantité de fluides</DataListTerm>
        <DataListDescription>
          {packaging.acceptation?.weight == null ? (
            <>{packaging.weight} kg </>
          ) : (
            <>{packaging.acceptation?.weight} kg</>
          )}
        </DataListDescription>
      </DataListItem>
    </DataList>
  );
}
