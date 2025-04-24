import React from "react";
import { Bsvhu } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewTransporterReceiptDetails,
  PreviewCompanyContact
} from "../BSDPreviewComponents";
import { getTransportModeLabel } from "../../../../dashboard/constants";
import { isForeignVat } from "@td/constants";

interface BSVHUPreviewTransportProps {
  bsd: Bsvhu;
}
const BSVHUPreviewTransport = ({ bsd }: BSVHUPreviewTransportProps) => {
  const isForeignCompany =
    bsd.transporter?.company?.vatNumber &&
    isForeignVat(bsd.transporter?.company?.vatNumber);
  return (
    <PreviewContainer>
      <PreviewContainerRow title={bsd.transporter?.company?.name}>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Raison sociale"
            value={bsd.transporter?.company?.name}
          />

          <PreviewTextRow
            label={!isForeignCompany ? "Siret" : "TVA intracommunautaire"}
            value={
              !isForeignCompany
                ? bsd.transporter?.company?.siret
                : bsd.transporter?.company?.vatNumber
            }
          />

          <PreviewTextRow
            label="Adresse"
            value={bsd.transporter?.company?.address}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewCompanyContact company={bsd.transporter?.company} />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewTransporterReceiptDetails transporter={bsd.transporter} />
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
