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
