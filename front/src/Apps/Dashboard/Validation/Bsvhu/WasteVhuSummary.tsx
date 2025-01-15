import { Bsvhu, BsvhuPackaging } from "@td/codegen-ui";
import * as React from "react";
import {
  DsfrDataList,
  DsfrDataListDescription,
  DsfrDataListItem,
  DsfrDataListTerm
} from "../../../../common/components";
import { isDangerous } from "@td/constants";

interface WasteVhuSummaryProps {
  bsvhu: Bsvhu;
}
const WasteVhuSummary = ({ bsvhu }: WasteVhuSummaryProps) => {
  const isDangerousWaste = isDangerous(bsvhu.wasteCode ?? "");
  const usualName = isDangerousWaste ? "VHU pollué" : "VHU dépollué";
  return (
    <DsfrDataList>
      <DsfrDataListItem>
        <DsfrDataListTerm>BSVHU n°</DsfrDataListTerm>
        <DsfrDataListDescription>{bsvhu.id}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Code déchet</DsfrDataListTerm>
        <DsfrDataListDescription>{bsvhu.wasteCode}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>Nom usuel du déchet</DsfrDataListTerm>
        <DsfrDataListDescription>{usualName}</DsfrDataListDescription>
      </DsfrDataListItem>
      <DsfrDataListItem>
        <DsfrDataListTerm>
          {bsvhu.packaging === BsvhuPackaging.Lot
            ? "Nombre de lot(s)"
            : "Nombre d'unité(s)"}
        </DsfrDataListTerm>
        <DsfrDataListDescription>{bsvhu.quantity}</DsfrDataListDescription>
      </DsfrDataListItem>
      {!bsvhu.destination?.reception?.weight && (
        <DsfrDataListItem>
          <DsfrDataListTerm>
            {bsvhu.weight?.isEstimate ? "Poids estimé" : "Poids réel"}
          </DsfrDataListTerm>
          <DsfrDataListDescription>
            {`${bsvhu.weight?.value}t`}
          </DsfrDataListDescription>
        </DsfrDataListItem>
      )}
      {bsvhu.destination?.reception?.weight && (
        <DsfrDataListItem>
          <DsfrDataListTerm>Poids accepté</DsfrDataListTerm>
          <DsfrDataListDescription>
            {`${bsvhu.destination?.reception?.weight}t`}
          </DsfrDataListDescription>
        </DsfrDataListItem>
      )}
    </DsfrDataList>
  );
};
export default WasteVhuSummary;
