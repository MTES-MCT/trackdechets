import * as React from "react";
import { Bspaoh } from "@td/codegen-ui";
import {
  DsfrDataList,
  DsfrDataListItem,
  DsfrDataListTerm,
  DsfrDataListDescription
} from "../../../../../common/components";
import {
  getSumPackagings,
  getVerbosePackagingType,
  getVerboseType,
  countPackagingPieces
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

export function BspaohWasteSummary({ bspaoh }: Readonly<Props>) {
  return (
    <DsfrDataList>
      <DsfrDataListItem>
        <DsfrDataListTerm>BSPAOH N°</DsfrDataListTerm>
        <DsfrDataListDescription>{bspaoh.id}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Nom usuel</DsfrDataListTerm>
        <DsfrDataListDescription>
          {getVerboseType(bspaoh.waste?.type)}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Code déchet</DsfrDataListTerm>
        <DsfrDataListDescription>{bspaoh.waste?.code}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Conditionnement</DsfrDataListTerm>
        <DsfrDataListDescription>
          <BspaohWasteSummaryPackagings packagings={bspaoh.waste?.packagings} />
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>
          Poids{" "}
          {bspaoh?.emitter?.emission?.detail?.weight?.isEstimate
            ? "estimé"
            : "réél"}
        </DsfrDataListTerm>
        <DsfrDataListDescription>
          {bspaoh.destination?.reception?.detail?.receivedWeight?.value ==
          null ? (
            <>{bspaoh.emitter?.emission?.detail?.weight?.value || "?"} kg(s)</>
          ) : (
            <>
              {bspaoh.destination?.reception?.detail?.receivedWeight?.value ||
                "?"}{" "}
              kg(s)
            </>
          )}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Nombre de pièces</DsfrDataListTerm>
        <DsfrDataListDescription>
          <span>
            {countPackagingPieces(bspaoh.waste?.packagings).toString()}
          </span>
        </DsfrDataListDescription>
      </DsfrDataListItem>
    </DsfrDataList>
  );
}
