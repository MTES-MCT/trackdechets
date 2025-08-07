import React from "react";
import { Bsda } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewCompanyContact,
  PreviewBooleanRow
} from "../BSDPreviewComponents";

interface BSDAPreviewWorkerProps {
  bsd: Bsda;
}
const BSDAPreviewWorker = ({ bsd }: BSDAPreviewWorkerProps) => {
  return (
    <PreviewContainer>
      <PreviewContainerRow>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Raison sociale"
            value={bsd.worker?.company?.name}
          />

          <PreviewTextRow label="Siret" value={bsd.worker?.company?.siret} />

          <PreviewTextRow
            label="Adresse"
            value={bsd.worker?.company?.address}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewCompanyContact company={bsd.worker?.company} />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewBooleanRow
            label="Travaux relevant de la sous-section 4"
            value={bsd.worker?.certification?.hasSubSectionFour}
          />

          <PreviewBooleanRow
            label="Travaux relevant de la sous-section 3"
            value={bsd.worker?.certification?.hasSubSectionThree}
          />

          {bsd.worker?.certification?.hasSubSectionThree && (
            <>
              <PreviewTextRow
                label="Numéro de certification"
                value={bsd.worker?.certification?.certificationNumber}
              />

              <PreviewTextRow
                label="Organisme de certification"
                value={bsd.worker?.certification?.organisation}
              />

              <PreviewDateRow
                label="Date de validité"
                value={bsd.worker?.certification?.validityLimit}
              />
            </>
          )}
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3} highlight>
          <PreviewTextRow
            label="Signé par"
            value={bsd.worker?.work?.signature?.author}
          />

          <PreviewDateRow
            label="Signé le"
            value={bsd.worker?.work?.signature?.date}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>
    </PreviewContainer>
  );
};

export default BSDAPreviewWorker;
