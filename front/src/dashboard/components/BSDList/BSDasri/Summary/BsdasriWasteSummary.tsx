import * as React from "react";
import { Bsdasri } from "codegen-ui";
import {
  DataList,
  DataListItem,
  DataListTerm,
  DataListDescription
} from "../../../../../common/components";

interface BsdasriWasteSummaryProps {
  bsdasri: Bsdasri;
}

export function BsdasriWasteSummary({ bsdasri }: BsdasriWasteSummaryProps) {
  const section = {
    INITIAL: ["emitter", "emission"],
    SIGNED_BY_PRODUCER: ["emitter", "emission"],
    SENT: ["transporter", "transport"],
    RECEIVED: ["destination", "reception"],
    PROCESSED: ["destination", "reception"]
  }[bsdasri["bsdasriStatus"]];

  const packagings = bsdasri?.[section[0]]?.[section[1]]?.packagings;
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
          {bsdasri?.[section[0]]?.[section[1]]?.volume} litres
        </DataListDescription>
      </DataListItem>
      <DataListItem>
        <DataListTerm>Contenant(s)</DataListTerm>
        <DataListDescription>
          {!!packagings?.length && (
            <>
              {packagings.map((packaging, idx) => (
                <div key={idx}>
                  {packaging.quantity} {packaging.other} {packaging.type} (
                  {packaging.volume} litre(s))
                </div>
              ))}
            </>
          )}
        </DataListDescription>
      </DataListItem>
    </DataList>
  );
}
