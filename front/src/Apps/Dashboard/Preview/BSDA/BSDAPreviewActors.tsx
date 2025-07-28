import React from "react";
import { Bsda } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewTextRow,
  PreviewCompanyContact,
  PreviewActor
} from "../BSDPreviewComponents";

interface BSDAPreviewActorsProps {
  bsd: Bsda;
}
const BSDAPreviewActors = ({ bsd }: BSDAPreviewActorsProps) => {
  const actorsPresent =
    bsd.ecoOrganisme ||
    bsd.broker ||
    (bsd.intermediaries && bsd.intermediaries.length > 0);

  return (
    <PreviewContainer>
      {!actorsPresent && (
        <div>Aucun autre acteur n'est mentionné sur le bordereau.</div>
      )}

      {bsd.ecoOrganisme && (
        <PreviewContainerRow title={"Éco-organisme"}>
          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow
              label="Raison sociale"
              value={bsd.ecoOrganisme?.name}
            />

            <PreviewTextRow label="Siret" value={bsd.ecoOrganisme?.siret} />
          </PreviewContainerCol>
        </PreviewContainerRow>
      )}

      {bsd.broker && <PreviewActor actor={bsd.broker} title="Courtier" />}

      {bsd.intermediaries?.map((intermediary, index) => (
        <PreviewContainerRow
          title={"Intermédiaire " + (index + 1)}
          key={intermediary.siret}
        >
          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow label="Raison sociale" value={intermediary.name} />

            <PreviewTextRow label="Siret" value={intermediary.siret} />

            <PreviewTextRow label="Adresse" value={intermediary.address} />
          </PreviewContainerCol>

          <PreviewContainerCol gridWidth={4}>
            <PreviewCompanyContact company={intermediary} />
          </PreviewContainerCol>
        </PreviewContainerRow>
      ))}
    </PreviewContainer>
  );
};

export default BSDAPreviewActors;
