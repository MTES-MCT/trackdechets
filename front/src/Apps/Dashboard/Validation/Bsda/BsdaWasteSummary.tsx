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
import ExpandableList from "../../../../dashboard/detail/bsda/ExpandableList";
import { isDefined } from "../../../../common/helper";

interface Props {
  bsda: Bsda;
  showCap?: boolean;
  showScelles?: boolean;
}

export function BsdaWasteSummary({ bsda, showCap, showScelles = true }: Props) {
  return (
    <DsfrDataList>
      <DsfrDataListItem>
        <DsfrDataListTerm>BSDA n°</DsfrDataListTerm>
        <DsfrDataListDescription>{bsda.id}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Code déchet</DsfrDataListTerm>
        <DsfrDataListDescription>{bsda.waste?.code}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>{WASTE_NAME_LABEL}</DsfrDataListTerm>
        <DsfrDataListDescription>
          {bsda.waste?.materialName}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Consistance</DsfrDataListTerm>
        <DsfrDataListDescription>
          {bsda.waste?.consistence?.toLowerCase()}
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
      {isDefined(bsda.destination?.reception?.acceptedWeight) && (
        <DsfrDataListItem>
          <DsfrDataListTerm>Poids accepté</DsfrDataListTerm>
          <DsfrDataListDescription>
            {`${bsda.destination?.reception?.acceptedWeight}t`}
          </DsfrDataListDescription>
        </DsfrDataListItem>
      )}
      <DsfrDataListItem>
        <DsfrDataListTerm>Conditionnement</DsfrDataListTerm>
        <DsfrDataListDescription>
          {bsda.packagings
            ?.map(p => `${p.quantity} ${PACKAGINGS_NAMES[p.type]}`)
            ?.join(", ")}
        </DsfrDataListDescription>
      </DsfrDataListItem>
      {showScelles && !!bsda.waste?.sealNumbers?.length && (
        <DsfrDataListItem>
          <DsfrDataListTerm>Scellés</DsfrDataListTerm>
          <DsfrDataListDescription>
            <ExpandableList elements={bsda.waste?.sealNumbers} />
          </DsfrDataListDescription>
        </DsfrDataListItem>
      )}
      {showCap &&
        (bsda.destination?.operation?.nextDestination?.cap ? (
          <DsfrDataListItem>
            <DsfrDataListTerm>CAP de l'exutoire</DsfrDataListTerm>
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
        ))}
    </DsfrDataList>
  );
}
