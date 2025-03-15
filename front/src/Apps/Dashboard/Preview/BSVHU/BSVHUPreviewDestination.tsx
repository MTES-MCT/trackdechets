import React from "react";
import { Bsvhu } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow
} from "../BSDPreviewComponents";
import { WasteAcceptationStatus } from "@td/codegen-ui";

const getVerboseAcceptationStatus = (
  acceptationStatus: WasteAcceptationStatus | null | undefined | string
): string => {
  if (!acceptationStatus) {
    return "";
  }
  const verbose = {
    ACCEPTED: "Non",
    REFUSED: "Refus total",
    "PARTIALLY REFUSED": "Refus partiel"
  };

  return verbose[acceptationStatus];
};

interface BSVHUPreviewDestinationProps {
  bsd: Bsvhu;
}
const BSVHUPreviewDestination = ({ bsd }: BSVHUPreviewDestinationProps) => {
  return (
    <PreviewContainer>
      <PreviewContainerRow title={"Installation de destination"}>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Raison sociale"
            value={bsd.destination?.company?.name}
          />

          <PreviewTextRow
            label="Siret"
            value={bsd.destination?.company?.siret}
          />

          <PreviewTextRow
            label="Adresse"
            value={bsd.destination?.company?.address}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Contact"
            value={bsd.destination?.company?.contact}
          />

          <PreviewTextRow
            label="Téléphone"
            value={bsd.destination?.company?.phone}
          />

          <PreviewTextRow
            label="Courriel"
            value={bsd.destination?.company?.mail}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Refus"
            value={getVerboseAcceptationStatus(
              bsd.destination?.reception?.acceptationStatus
            )}
          />

          <PreviewTextRow
            label="Poids réceptionné"
            value={bsd.weight?.value}
            units={"tonne(s)"}
          />

          {/* TODO */}
          <PreviewTextRow
            label="Poids refusé"
            value={bsd.destination?.reception?.weight}
            units={"tonne(s)"}
          />

          <PreviewTextRow
            label="Poids traité"
            value={bsd.destination?.reception?.weight}
            units={"tonne(s)"}
          />

          <PreviewTextRow
            label="Opération réalisée"
            value={bsd.destination?.operation?.code}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3} highlight>
          <PreviewDateRow
            label="Reçu et accepté le"
            value={bsd.destination?.reception?.date}
          />

          <PreviewTextRow
            label="Signé par"
            value={bsd.destination?.reception?.signature?.author}
          />

          <PreviewDateRow
            label="Traité le"
            value={bsd.destination?.operation?.date}
          />

          <PreviewTextRow
            label="Signé par"
            value={bsd.destination?.operation?.signature?.author}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow separator>
        <PreviewContainerCol gridWidth={3}>
          {/* TODO */}
          <PreviewTextRow label="Champ libre" value={bsd.customId} />
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSVHUPreviewDestination;
