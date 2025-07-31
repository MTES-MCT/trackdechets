import React, { useMemo } from "react";
import { Bsda } from "@td/codegen-ui";
import { getPackagingInfosSummary } from "../../../common/utils/packagingsBsddSummary";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow
} from "../BSDPreviewComponents";

interface BSDAPreviewWasteProps {
  bsd: Bsda;
}
const BSDAPreviewWaste = ({ bsd }: BSDAPreviewWasteProps) => {
  const conditionnement = useMemo(
    () => (bsd?.packagings ? getPackagingInfosSummary(bsd.packagings) : ""),
    [bsd]
  );

  return (
    <PreviewContainer>
      <PreviewContainerRow title={"Quantité"}>
        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow
            label={`Poids ${bsd.weight?.isEstimate ? "estimé" : "réel"}`}
            tooltip={
              bsd.weight?.isEstimate
                ? `"Quantité estimée conformément à l'article 5.4.1.1.3.2 de l'ADR" si soumis`
                : undefined
            }
            value={bsd.weight?.value}
            units={"t"}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow
            label="Quantité réelle reçue"
            value={bsd.destination?.reception?.weight}
            units={"t"}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow title={"Opérations"} separator>
        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow
            label="Opération prévue"
            value={bsd.destination?.plannedOperationCode}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow
            label="Opération réalisée"
            value={bsd.destination?.operation?.code}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewDateRow
            label="Date de traitement"
            value={bsd.destination?.operation?.date}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow title={"Conditionnement"} separator>
        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow label="Conditionnement" value={conditionnement} />
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSDAPreviewWaste;
