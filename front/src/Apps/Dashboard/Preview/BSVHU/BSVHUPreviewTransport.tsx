import React from "react";
import { Bsvhu } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewBooleanRow
} from "../BSDPreviewComponents";
import { getTransportModeLabel } from "../../../../dashboard/constants";

interface BSVHUPreviewTransportProps {
  bsd: Bsvhu;
}
const BSVHUPreviewTransport = ({ bsd }: BSVHUPreviewTransportProps) => {
  return (
    <PreviewContainer>
      <PreviewContainerRow title={bsd.transporter?.company?.name}>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Raison sociale"
            value={bsd.transporter?.company?.name}
          />

          <PreviewTextRow
            label="Siret"
            value={bsd.transporter?.company?.siret}
          />

          <PreviewTextRow
            label="Adresse"
            value={bsd.transporter?.company?.address}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Contact"
            value={bsd.transporter?.company?.contact}
          />

          <PreviewTextRow
            label="Téléphone"
            value={bsd.transporter?.company?.phone}
          />

          <PreviewTextRow
            label="Courriel"
            value={bsd.transporter?.company?.mail}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          {bsd.transporter?.recepisse?.isExempted ? (
            <PreviewBooleanRow
              label="Exemption de récépissé"
              value={bsd.transporter?.recepisse?.isExempted}
            />
          ) : (
            <>
              <PreviewTextRow
                label="Récépissé n°"
                value={bsd.transporter?.recepisse?.number}
              />

              <PreviewTextRow
                label="Récépissé département"
                value={bsd.transporter?.recepisse?.department}
              />

              <PreviewDateRow
                label="Récépissé valable jusqu'au"
                value={bsd.transporter?.recepisse?.validityLimit}
              />
            </>
          )}
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3} highlight>
          <PreviewTextRow
            label="Mode de transport"
            value={getTransportModeLabel(bsd.transporter?.transport?.mode)}
          />

          <PreviewTextRow
            label="Immatriculation(s)"
            value={
              bsd.transporter?.transport?.plates
                ? bsd.transporter.transport.plates.join(", ")
                : null
            }
          />

          <PreviewDateRow
            label="Emporté le"
            value={bsd.transporter?.transport?.takenOverAt}
          />

          <PreviewTextRow
            label="Signé par"
            value={bsd.transporter?.transport?.signature?.author}
          />

          <PreviewDateRow
            label="Remis au destinataire"
            value={bsd.destination?.reception?.date}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow separator>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Champ libre"
            value={bsd.transporter?.customInfo}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSVHUPreviewTransport;
