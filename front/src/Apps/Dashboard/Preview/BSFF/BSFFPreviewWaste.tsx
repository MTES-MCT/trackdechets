import React, { useMemo } from "react";
import { Bsff } from "@td/codegen-ui";
import { getPackagingInfosSummary } from "../../../common/utils/packagingsBsffSummary";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow
} from "../BSDPreviewComponents";

interface BSFFPreviewWasteProps {
  bsd: Bsff;
}
const BSFFPreviewWaste = ({ bsd }: BSFFPreviewWasteProps) => {
  const contenant = useMemo(
    () =>
      bsd?.packagings
        ? getPackagingInfosSummary(bsd.packagings, { expanded: true })
        : "",
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
          <PreviewTextRow label="Quantité réelle reçue" value="-" units={"t"} />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow title={"Opérations à la destination"} separator>
        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow
            label="Opération prévue"
            value={bsd.destination?.plannedOperationCode}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewTextRow label="Opération réalisée" value="-" />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={4}>
          <PreviewDateRow
            label="Date de traitement"
            value={bsd.destination?.reception?.date}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow title={"Contenant"} separator>
        <PreviewContainerCol gridWidth={12}>
          <PreviewTextRow label="Contenant" value={contenant} />
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSFFPreviewWaste;
