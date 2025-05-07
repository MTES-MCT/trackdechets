import * as React from "react";
import { Bsda } from "@td/codegen-ui";
import {
  DsfrDataList,
  DsfrDataListDescription,
  DsfrDataListItem,
  DsfrDataListTerm
} from "../../../../common/components";
import { PACKAGINGS_NAMES } from "../../../../form/bsda/components/packagings/Packagings";
import { WASTE_NAME_LABEL } from "../../../common/wordings/wordingsCommon";

interface Props {
  bsda: Bsda;
}

export function BsdaWasteSummary({ bsda }: Props) {
  return (
    <DsfrDataList>
      <DsfrDataListItem>
        <DsfrDataListTerm>BSDA n°</DsfrDataListTerm>
        <DsfrDataListDescription>{bsda.id}</DsfrDataListDescription>
      </DsfrDataListItem>
      {bsda.destination?.operation?.nextDestination?.cap ? (
        <DsfrDataListItem>
          <DsfrDataListTerm>CAP avec l'exutoire</DsfrDataListTerm>
          <DsfrDataListDescription>
            {bsda.destination?.operation?.nextDestination?.cap}
          </DsfrDataListDescription>
        </DsfrDataListItem>
      ) : (
        <DsfrDataListItem>
          <DsfrDataListTerm>CAP</DsfrDataListTerm>
          <DsfrDataListDescription>
            {bsda.destination?.cap}
          </DsfrDataListDescription>
        </DsfrDataListItem>
      )}
      <DsfrDataListItem>
        <DsfrDataListTerm>Conditionnement</DsfrDataListTerm>
        <DsfrDataListDescription>
          {bsda.packagings
            ?.map(p => `${p.quantity} ${PACKAGINGS_NAMES[p.type]}`)
            .join(", ")}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Code déchet</DsfrDataListTerm>
        <DsfrDataListDescription>{bsda.waste?.code}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Code famille</DsfrDataListTerm>
        <DsfrDataListDescription>
          {bsda.waste?.familyCode}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>{WASTE_NAME_LABEL}</DsfrDataListTerm>
        <DsfrDataListDescription>
          {bsda.waste?.materialName}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      {!bsda.destination?.reception?.weight && (
        <DsfrDataListItem>
          <DsfrDataListTerm>
            {bsda.weight?.isEstimate ? "Poids estimé" : "Poids réel"}
          </DsfrDataListTerm>
          <DsfrDataListDescription>
            {`${bsda.weight?.value}t`}
          </DsfrDataListDescription>
        </DsfrDataListItem>
      )}
      {bsda.destination?.reception?.weight !== null &&
        bsda.destination?.reception?.weight !== undefined && (
          <DsfrDataListItem>
            <DsfrDataListTerm>Poids accepté</DsfrDataListTerm>
            <DsfrDataListDescription>
              {`${bsda.destination?.reception?.weight}t`}
            </DsfrDataListDescription>
          </DsfrDataListItem>
        )}
    </DsfrDataList>
  );
}
