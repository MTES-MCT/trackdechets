import React from "react";
import { Bsvhu, BsvhuStatus } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow
} from "../BSDPreviewComponents";

const UNITE_IDENTIFICATION_TYPES_LABELS = {
  NUMERO_ORDRE_REGISTRE_POLICE:
    "identification par n° d'ordre tels qu'ils figurent dans le registre de police",
  NUMERO_IMMATRICULATION: "identification par numéro d’immatriculation",
  NUMERO_FICHE_DROMCOM: "Identification par numéro de fiche VHU DROMCOM",
  NUMERO_ORDRE_LOTS_SORTANTS:
    "identification par numéro d'ordre des lots sortants"
};

const getIdentificationTypeLabel = (bsvhu: Bsvhu) => {
  if (bsvhu?.identification?.type === "NUMERO_ORDRE_LOTS_SORTANTS") {
    //deprecated, kept for older bsvhus
    return "N° d'ordre des lots sortants";
  }
  if (bsvhu.packaging === "LOT") {
    return "En lots (identification par numéro de lot)";
  }
  return bsvhu?.identification?.type
    ? `En unités (${
        UNITE_IDENTIFICATION_TYPES_LABELS[bsvhu.identification.type]
      })`
    : "En unités";
};

interface BSVHUPreviewWasteProps {
  bsd: Bsvhu;
}
const BSVHUPreviewWaste = ({ bsd }: BSVHUPreviewWasteProps) => {
  return (
    <PreviewContainer>
      <PreviewContainerRow>
        <PreviewContainerCol gridWidth={4} title={"Quantité"}>
          <PreviewTextRow
            label={`Poids prévu net ${
              bsd.weight?.isEstimate ? "estimé" : "réel"
            }`}
            value={bsd.weight?.value}
            units="tonne(s)"
          />

          <PreviewTextRow
            label="Poids réceptionné net"
            value={bsd.destination?.reception?.weight}
            units="tonne(s)"
          />

          <PreviewTextRow
            label="Poids traité net"
            value={
              bsd.status === BsvhuStatus.Processed
                ? bsd.destination?.reception?.weight
                : ""
            }
            units="tonne(s)"
          />
        </PreviewContainerCol>
        <PreviewContainerCol gridWidth={4} title={"Conditionnement"}>
          <PreviewTextRow
            label="Conditionnement"
            value={getIdentificationTypeLabel(bsd)}
          />

          <PreviewTextRow
            label="Nombre"
            value={bsd.identification?.numbers?.length}
          />

          <PreviewTextRow
            label="Identifications"
            value={bsd.identification?.numbers?.join(", ")}
          />
        </PreviewContainerCol>
        <PreviewContainerCol gridWidth={4} title={"Traitement"}>
          <PreviewTextRow
            label="Code de traitement prévu"
            value={bsd.destination?.plannedOperationCode}
          />
          <PreviewTextRow
            label="Code de traitement effectué"
            value={bsd.destination?.operation?.code}
          />
          <PreviewDateRow
            label="Date de traitement"
            value={bsd.destination?.operation?.signature?.date}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSVHUPreviewWaste;
