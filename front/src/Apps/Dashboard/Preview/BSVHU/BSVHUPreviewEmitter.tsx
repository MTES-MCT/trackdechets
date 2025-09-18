import React from "react";
import { Bsvhu } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewCompanyContact
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
            value={
              bsd.emitter?.company?.siret ? bsd.emitter?.company?.name : "-"
            }
          />

          <PreviewTextRow label="SIRET" value={bsd.emitter?.company?.siret} />

          {isIrregularSituation && !bsd.emitter?.company?.siret && (
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
          <PreviewCompanyContact company={bsd.emitter?.company} />

          <PreviewTextRow
            label="Numéro d'agrément"
            value={bsd.emitter?.agrementNumber}
          />
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

          {isIrregularSituation && (
            <PreviewTextRow
              label="Signature de l'émetteur"
              value={
                bsd.emitter?.noSiret || !bsd.emitter?.company?.siret
                  ? "Oui"
                  : "Non"
              }
            />
          )}
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSVHUPreviewEmitter;
