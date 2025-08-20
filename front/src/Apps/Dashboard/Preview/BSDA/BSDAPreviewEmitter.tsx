import React from "react";
import { Bsda } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewCompanyContact
} from "../BSDPreviewComponents";
import Alert from "@codegouvfr/react-dsfr/Alert";

interface BSDAPreviewEmitterProps {
  bsd: Bsda;
}
const BSDAPreviewEmitter = ({ bsd }: BSDAPreviewEmitterProps) => {
  const hasPickupSite = !!bsd.emitter?.pickupSite;
  const isPrivateIndividual = !!bsd.emitter?.isPrivateIndividual;

  return (
    <PreviewContainer>
      {isPrivateIndividual && (
        <Alert
          description="Le MOA ou le détenteur est un particulier"
          severity="info"
          small
          className="fr-mb-3w"
        />
      )}

      <PreviewContainerRow>
        <PreviewContainerCol gridWidth={3}>
          {isPrivateIndividual ? (
            <PreviewTextRow
              label="Nom et prénom"
              value={bsd.emitter?.company?.name}
            />
          ) : (
            <>
              <PreviewTextRow
                label="Raison sociale"
                value={bsd.emitter?.company?.name}
              />

              <PreviewTextRow
                label="SIRET"
                value={bsd.emitter?.company?.siret}
              />
            </>
          )}

          <PreviewTextRow
            label="Adresse"
            value={bsd.emitter?.company?.address}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={6}>
          <PreviewCompanyContact
            company={bsd.emitter?.company}
            omitContact={isPrivateIndividual}
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

          <PreviewTextRow
            label="Signature de l'émetteur"
            value={
              isPrivateIndividual
                ? "Non"
                : bsd.emitter?.emission?.signature?.date
                ? "Oui"
                : "-"
            }
          />
        </PreviewContainerCol>
      </PreviewContainerRow>

      {hasPickupSite && (
        <PreviewContainerRow separator>
          <PreviewContainerCol gridWidth={6}>
            <PreviewTextRow
              label="Nom de chantier"
              value={bsd.emitter?.pickupSite?.name}
            />

            <PreviewTextRow
              label="Adresse de chantier"
              value={`${bsd.emitter?.pickupSite?.address}, ${bsd.emitter?.pickupSite?.postalCode} ${bsd.emitter?.pickupSite?.city}`}
            />

            <PreviewTextRow
              label="Informations complémentaires sur le chantier"
              value={bsd.emitter?.pickupSite?.infos}
            />
          </PreviewContainerCol>
        </PreviewContainerRow>
      )}
    </PreviewContainer>
  );
};

export default BSDAPreviewEmitter;
