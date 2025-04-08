import React from "react";
import { Bsvhu, BsvhuStatus } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewCompanyContact
} from "../BSDPreviewComponents";
import { getVerboseAcceptationStatus } from "../BSDPreviewUtils";

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
          <PreviewCompanyContact company={bsd.destination?.company} />

          <PreviewTextRow
            label="Numéro d'agrément"
            value={bsd.destination?.agrementNumber}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Statut de l'acceptation"
            value={getVerboseAcceptationStatus(
              bsd.destination?.reception?.acceptationStatus
            )}
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

      {/* <PreviewContainerRow separator>
        <PreviewContainerCol gridWidth={3}> */}
      {/* TODO */}
      {/* <PreviewTextRow label="Champ libre" value={bsd.customId} />
        </PreviewContainerCol>
      </PreviewContainerRow> */}
    </PreviewContainer>
  );
};

export default BSVHUPreviewDestination;
