import * as React from "react";
import { Bspaoh } from "@td/codegen-ui";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription
} from "../../../../../common/components";
import {
  getSumPackagings,
  getVerbosePackagingType,
  getVerboseType, countPackagingPieces
} from "../../../BSDList/BSPaoh/paohUtils";
interface Props {
  bspaoh: Bspaoh;
}

const BspaohWasteSummaryPackagings = ({ packagings }) => {
  const sumPackagings = getSumPackagings(packagings ?? []);
  const txt = Object.entries(sumPackagings)
    .map(([k, v]) => `${v} ${getVerbosePackagingType(k)}${v > 1 ? "s" : ""}`)
    .join(", ");
  return <span>{txt}</span>;
};
  
export function BspaohWasteSummary({ bspaoh }: Props) {
  return (
    <DataList>
      <DataListItem>
        <DataListTerm>BSPAOH n°</DataListTerm>
        <DataListDescription>{bspaoh.id}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Nom Usuel</DataListTerm>
        <DataListDescription>
          {getVerboseType(bspaoh.waste?.type)}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Code déchet</DataListTerm>
        <DataListDescription>{bspaoh.waste?.code}</DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Conditionnement</DataListTerm>
        <DataListDescription>
          <BspaohWasteSummaryPackagings packagings={bspaoh.waste?.packagings} />
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Poids</DataListTerm>
        <DataListDescription>
          {bspaoh.destination?.reception?.detail?.weight?.value == null ? (
            <>{bspaoh.emitter?.emission?.detail?.weight?.value || "?"} kg(s)</>
          ) : (
            <>
              {bspaoh.destination?.reception?.detail?.weight?.value || "?"}{" "}
              kg(s)
            </>
          )}
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Nombre de pièces</DataListTerm>
        <DataListDescription>
          <span>{countPackagingPieces(bspaoh.waste?.packagings).toString()}</span>
        </DataListDescription>
      </DataListItem>
    </DataList>
  );
}
