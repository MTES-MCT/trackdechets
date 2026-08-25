import React from "react";
import { Bsff } from "@td/codegen-ui";

import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewTextRow
} from "../BSDPreviewComponents";

interface BSFFPreviewDetenteurProps {
  bsd: Bsff;
}

const BSFFPreviewDetenteur = ({ bsd }: BSFFPreviewDetenteurProps) => {
  const ficheInterventions =
    bsd.ficheInterventions?.filter(fi => fi?.detenteur) ?? [];

  if (ficheInterventions.length === 0) {
    return null;
  }

  return (
    <>
      {ficheInterventions.map((ficheIntervention, index) => {
        const detenteur = ficheIntervention.detenteur;

        if (!detenteur) {
          return null;
        }

        return (
          <PreviewContainer key={ficheIntervention.id ?? index}>
            <PreviewContainerRow>
              <PreviewContainerCol gridWidth={3}>
                <PreviewTextRow
                  label="Raison sociale"
                  value={detenteur.company?.name}
                />

                <PreviewTextRow
                  label="SIRET"
                  value={detenteur.company?.siret}
                />
              </PreviewContainerCol>

              <PreviewContainerCol gridWidth={6}>
                <PreviewTextRow
                  label="Numéro de fiche d'intervention"
                  value={ficheIntervention.numero}
                />

                <PreviewTextRow
                  label="Quantité fluides en Kg"
                  value={ficheIntervention.weight}
                  units="kg"
                />
                <PreviewTextRow
                  label="Code postal lieu de collecte"
                  value={ficheIntervention.postalCode}
                />
              </PreviewContainerCol>
            </PreviewContainerRow>
          </PreviewContainer>
        );
      })}
    </>
  );
};

export default BSFFPreviewDetenteur;
