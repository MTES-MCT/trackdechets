import React from "react";
import { Bsff, BsffPackagingType, BsffType } from "@td/codegen-ui";

import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewTextRow
} from "../BSDPreviewComponents";
import { getBsffDetainerRows } from "./bsffPreviewUtils";

interface BSFFPreviewDetenteurProps {
  bsd: Bsff;
}

const BSFFPreviewDetenteur = ({ bsd }: BSFFPreviewDetenteurProps) => {
  const rows = getBsffDetainerRows(bsd);

  if (rows.length === 0) {
    return null;
  }

  return (
    <>
      {rows.map(({ detenteur, packaging, ficheIntervention }, index) => (
        <PreviewContainer
          key={`${packaging?.id ?? "legacy"}-${
            ficheIntervention?.id ?? "without-fiche"
          }-${index}`}
        >
          <PreviewContainerRow>
            <PreviewContainerCol gridWidth={3}>
              <PreviewTextRow
                label={
                  detenteur.isPrivateIndividual
                    ? "Nom (particulier)"
                    : "Raison sociale"
                }
                value={detenteur.company?.name}
              />

              <PreviewTextRow label="SIRET" value={detenteur.company?.siret} />
              <PreviewTextRow
                label="Adresse"
                value={detenteur.company?.address}
              />
            </PreviewContainerCol>

            <PreviewContainerCol gridWidth={6}>
              <PreviewTextRow
                label="Contact"
                value={detenteur.company?.contact}
              />

              <PreviewTextRow
                label="Téléphone"
                value={detenteur.company?.phone}
              />

              <PreviewTextRow
                label="Courriel"
                value={detenteur.company?.mail}
              />

              <PreviewTextRow
                label="Contenant associé"
                value={
                  packaging
                    ? `${
                        packaging.type === BsffPackagingType.Autre
                          ? packaging.other || packaging.type
                          : packaging.type
                      } n°${packaging.numero}`
                    : null
                }
              />

              <PreviewTextRow
                label="Quantité de fluide"
                value={packaging?.weight}
                units="kg"
              />

              {ficheIntervention && (
                <PreviewTextRow
                  label="Numéro de fiche d'intervention"
                  value={
                    ficheIntervention.numero ||
                    (bsd.type === BsffType.CollectePetitesQuantites &&
                    ficheIntervention.isExempted
                      ? "Exemption au titre R.543-82 du code de l'environnement"
                      : null)
                  }
                />
              )}
            </PreviewContainerCol>
          </PreviewContainerRow>
        </PreviewContainer>
      ))}
    </>
  );
};

export default BSFFPreviewDetenteur;
