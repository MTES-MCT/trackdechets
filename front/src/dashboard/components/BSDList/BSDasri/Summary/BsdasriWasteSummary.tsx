import * as React from "react";
import { Bsdasri } from "generated/graphql/types";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription,
} from "common/components";

interface BsdasriWasteSummaryProps {
  bsdasri: Bsdasri;
}

export function BsdasriWasteSummary({ bsdasri }: BsdasriWasteSummaryProps) {
  const section = {
    INITIAL: "emission",
    SIGNED_BY_PRODUCER: "emission",
    SENT: "transport",
    RECEIVED: "reception",
    PROCESSED: "reception",
  }[bsdasri["bsdasriStatus"]];

  return (
    <DataList>
      <DataListItem>
        <DataListTerm>Dasri n°</DataListTerm>
        <DataListDescription>{bsdasri.id}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code déchet</DataListTerm>
        <DataListDescription>{bsdasri?.waste?.code}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code traitement</DataListTerm>
        <DataListDescription>
          {bsdasri?.destination?.operation?.code || "Non renseigné"}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Volume</DataListTerm>
        <DataListDescription>
          {bsdasri?.[section]?.volume} litres
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Contenant(s)</DataListTerm>
        <DataListDescription>
          {!!bsdasri[section]?.packagingInfos?.length &&
            bsdasri[section]?.packagingInfos
              .map(
                packaging =>
                  `${packaging.quantity}  ${packaging.other} ${packaging.type} (${packaging.volume} litre(s))`
              )
              .join(", ")}
        </DataListDescription>
      </DataListItem>
    </DataList>
  );
}
