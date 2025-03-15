import React from "react";
import { Bsvhu } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow
} from "../BSDPreviewComponents";
import Alert from "@codegouvfr/react-dsfr/Alert";

interface BSVHUPreviewEmitterProps {
  bsd: Bsvhu;
}
const BSVHUPreviewEmitter = ({ bsd }: BSVHUPreviewEmitterProps) => {
  const isIrregularSituation = bsd.emitter?.irregularSituation;

  return (
    <PreviewContainer>
      {isIrregularSituation && (
        <Alert
          description="Installation en situation irrégulière"
          severity="info"
          small
          className="fr-mb-3w"
        />
      )}

      <PreviewContainerRow>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Raison sociale"
            value={isIrregularSituation ? "-" : bsd.emitter?.company?.name}
          />

          <PreviewTextRow label="Siret" value={bsd.emitter?.company?.siret} />

          {isIrregularSituation && (
            <PreviewTextRow
              label="Nom ou identification de l'installation"
              value={bsd.emitter?.company?.name}
            />
          )}

          <PreviewTextRow
            label="Adresse"
            value={bsd.emitter?.company?.address}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={6}>
          <PreviewTextRow
            label="Contact"
            value={bsd.emitter?.company?.contact}
          />

          <PreviewTextRow
            label="Téléphone"
            value={bsd.emitter?.company?.phone}
          />

          <PreviewTextRow label="Courriel" value={bsd.emitter?.company?.mail} />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3} highlight>
          <PreviewTextRow
            label="Signé par"
            value={bsd.emitter?.emission?.signature?.author}
          />

          <PreviewDateRow
            label="Signé le"
            value={bsd.emitter?.emission?.signature?.date}
          />
          {/* TODO */}
          <PreviewTextRow label="Signature de l'émetteur" value={null} />
        </PreviewContainerCol>
      </PreviewContainerRow>

      <PreviewContainerRow separator>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow label="Champ libre" value={bsd.customId} />
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSVHUPreviewEmitter;
