import React from "react";
import { Bsvhu } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow
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

      {bsd.broker && (
        <PreviewContainerRow title={"Courtier"}>
          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow
              label="Raison sociale"
              value={bsd.broker?.company?.name}
            />

            <PreviewTextRow label="Siret" value={bsd.broker?.company?.siret} />

            <PreviewTextRow
              label="Adresse"
              value={bsd.broker?.company?.address}
            />
          </PreviewContainerCol>

          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow
              label="Contact"
              value={bsd.broker?.company?.contact}
            />

            <PreviewTextRow
              label="Téléphone"
              value={bsd.broker?.company?.phone}
            />

            <PreviewTextRow
              label="Courriel"
              value={bsd.broker?.company?.mail}
            />
          </PreviewContainerCol>

          {bsd.broker?.recepisse && (
            <PreviewContainerCol gridWidth={4}>
              <PreviewTextRow
                label="Récépissé n°"
                value={bsd.broker?.recepisse?.number}
              />

              <PreviewTextRow
                label="Récépissé département"
                value={bsd.broker?.recepisse?.department}
              />

              <PreviewDateRow
                label="Récépissé valable jusqu'au"
                value={bsd.broker?.recepisse?.validityLimit}
              />
            </PreviewContainerCol>
          )}
        </PreviewContainerRow>
      )}

      {bsd.trader && (
        <PreviewContainerRow title={"Négociant"}>
          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow
              label="Raison sociale"
              value={bsd.trader?.company?.name}
            />

            <PreviewTextRow label="Siret" value={bsd.trader?.company?.siret} />

            <PreviewTextRow
              label="Adresse"
              value={bsd.trader?.company?.address}
            />
          </PreviewContainerCol>

          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow
              label="Contact"
              value={bsd.trader?.company?.contact}
            />

            <PreviewTextRow
              label="Téléphone"
              value={bsd.trader?.company?.phone}
            />

            <PreviewTextRow
              label="Courriel"
              value={bsd.trader?.company?.mail}
            />
          </PreviewContainerCol>

          {bsd.trader?.recepisse && (
            <PreviewContainerCol gridWidth={4}>
              <PreviewTextRow
                label="Récépissé n°"
                value={bsd.trader?.recepisse?.number}
              />

              <PreviewTextRow
                label="Récépissé département"
                value={bsd.trader?.recepisse?.department}
              />

              <PreviewDateRow
                label="Récépissé valable jusqu'au"
                value={bsd.trader?.recepisse?.validityLimit}
              />
            </PreviewContainerCol>
          )}
        </PreviewContainerRow>
      )}

      {bsd.intermediaries?.map((intermediary, index) => (
        <PreviewContainerRow title={"Intermédiaire " + (index + 1)}>
          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow label="Raison sociale" value={intermediary.name} />

            <PreviewTextRow label="Siret" value={intermediary.siret} />

            <PreviewTextRow label="Adresse" value={intermediary.address} />
          </PreviewContainerCol>

          <PreviewContainerCol gridWidth={4}>
            <PreviewTextRow label="Contact" value={intermediary.contact} />

            <PreviewTextRow label="Téléphone" value={intermediary.phone} />

            <PreviewTextRow label="Courriel" value={intermediary.mail} />
          </PreviewContainerCol>
        </PreviewContainerRow>
      ))}
    </PreviewContainer>
  );
};

export default BSVHUPreviewActors;
