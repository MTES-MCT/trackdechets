import React from "react";
import { Bsff, BsffType } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewTextRow,
  PreviewCompanyContact,
  PreviewActor
} from "../BSDPreviewComponents";

interface BSFFPreviewActorsProps {
  bsd: Bsff;
}
const BSFFPreviewActors = ({ bsd }: BSFFPreviewActorsProps) => {
  const actorsPresent =
    bsd.emitter ||
    bsd.transporter ||
    (bsd.transporters && bsd.transporters.length > 0);

  return (
    <PreviewContainer>
      {!actorsPresent && (
        <div>Aucun autre acteur n'est mentionné sur le bordereau.</div>
      )}

      {bsd.type === BsffType.CollectePetitesQuantites && (
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

export default BSFFPreviewActors;
