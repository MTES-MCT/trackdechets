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

  // Détenteurs des packagings qui n'ont PAS de fiche d'intervention
  const detenteursWithoutFiche: Array<{
    detenteur: any;
    packagingNumero: string;
  }> = [];

  bsd.packagings?.forEach(p => {
    // Si le packaging a des détenteurs et PAS de fiche d'intervention
    if (
      p.detenteurs &&
      p.detenteurs.length > 0 &&
      (!p.ficheInterventions || p.ficheInterventions.length === 0)
    ) {
      p.detenteurs.forEach(detenteur => {
        detenteursWithoutFiche.push({
          detenteur,
          packagingNumero: p.numero
        });
      });
    }
  });

  if (ficheInterventions.length === 0 && detenteursWithoutFiche.length === 0) {
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

      {detenteursWithoutFiche.map((item, index) => (
        <PreviewContainer key={`without-fiche-${index}`}>
          <PreviewContainerRow>
            <PreviewContainerCol gridWidth={3}>
              <PreviewTextRow
                label={
                  item.detenteur.isPrivateIndividual
                    ? "Nom (particulier)"
                    : "Raison sociale"
                }
                value={item.detenteur.company?.name}
              />

              <PreviewTextRow
                label="SIRET"
                value={item.detenteur.company?.siret}
              />
            </PreviewContainerCol>

            <PreviewContainerCol gridWidth={6}>
              <PreviewTextRow
                label="Adresse"
                value={item.detenteur.company?.address}
              />

              <PreviewTextRow
                label="Contact"
                value={item.detenteur.company?.contact}
              />

              <PreviewTextRow
                label="Téléphone"
                value={item.detenteur.company?.phone}
              />

              <PreviewTextRow
                label="Email"
                value={item.detenteur.company?.mail}
              />

              <PreviewTextRow
                label="Contenant associé"
                value={item.packagingNumero}
              />
            </PreviewContainerCol>
          </PreviewContainerRow>
        </PreviewContainer>
      ))}
    </>
  );
};

export default BSFFPreviewDetenteur;
