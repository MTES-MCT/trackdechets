import React from "react";
import { Bsvhu } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewTextRow,
  PreviewCompanyContact,
  PreviewActor
} from "../BSDPreviewComponents";

interface BSVHUPreviewActorsProps {
  bsd: Bsvhu;
}
const BSVHUPreviewActors = ({ bsd }: BSVHUPreviewActorsProps) => {
  const actorsPresent =
    bsd.ecoOrganisme ||
    bsd.broker ||
    bsd.trader ||
    (bsd.intermediaries && bsd.intermediaries.length > 0);

  return (
    <PreviewContainer>
      {!actorsPresent && (
        <div>Aucun autre acteur n'est visé sur le bordereau.</div>
      )}

      {bsd.ecoOrganisme && (
        <PreviewContainerRow title={"Éco-organisme"}>
          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow
              label="Raison sociale"
              value={bsd.ecoOrganisme?.name}
            />

            <PreviewTextRow label="SIRET" value={bsd.ecoOrganisme?.siret} />
          </PreviewContainerCol>
        </PreviewContainerRow>
      )}

      {bsd.broker && <PreviewActor actor={bsd.broker} title="Courtier" />}

      {bsd.trader && <PreviewActor actor={bsd.trader} title="Négociant" />}

      {bsd.intermediaries?.map((intermediary, index) => (
        <PreviewContainerRow
          title={"Intermédiaire " + (index + 1)}
          key={intermediary.siret}
        >
          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow label="Raison sociale" value={intermediary.name} />

            <PreviewTextRow label="SIRET" value={intermediary.siret} />

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

export default BSVHUPreviewActors;
