import React from "react";
import { Bsff } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewCompanyContact
} from "../BSDPreviewComponents";

interface BSFFPreviewEmitterProps {
  bsd: Bsff;
}
const BSFFPreviewEmitter = ({ bsd }: BSFFPreviewEmitterProps) => {
  const site = bsd.emitter?.pickupSite;
  const pickupAddress =
    site?.address?.trim() ||
    [site?.street, site?.address2, site?.postalCode, site?.city]
      .filter(Boolean)
      .join(" ");
  return (
    <PreviewContainer>
      <PreviewContainerRow>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Raison sociale"
            value={bsd.emitter?.company?.name}
          />

          <PreviewTextRow label="SIRET" value={bsd.emitter?.company?.siret} />
          <PreviewTextRow
            label="Tva intracommunautaire"
            value={bsd.emitter?.company?.vatNumber}
          />
          <PreviewTextRow
            label="Adresse"
            value={bsd.emitter?.company?.address}
          />
          {!!site && (
            <>
              <PreviewTextRow
                label="Nom du site d'enlèvement"
                value={site.name}
              />
              <PreviewTextRow
                label="Adresse de collecte des déchets"
                value={pickupAddress}
              />
              <PreviewTextRow
                label="Informations complémentaires"
                value={site.infos}
              />
            </>
          )}
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={6}>
          <PreviewCompanyContact company={bsd.emitter?.company} />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3} highlight>
          <PreviewTextRow
            label="Poids total"
            value={bsd.weight?.value}
            units={"kg"}
          />

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
            value={bsd.emitter?.emission?.signature?.date ? "Oui" : "-"}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSFFPreviewEmitter;
