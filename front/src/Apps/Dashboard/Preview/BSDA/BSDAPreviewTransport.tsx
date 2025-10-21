import React from "react";
import { Bsda } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewTransporterReceiptDetails,
  PreviewCompanyContact
} from "../BSDPreviewComponents";
import { getTransportModeLabel } from "../../../../dashboard/constants";
import { isForeignVat } from "@td/constants";

interface BSDAPreviewTransportProps {
  bsd: Bsda;
}
const BSDAPreviewTransport = ({ bsd }: BSDAPreviewTransportProps) => {
  const isMultiModal = bsd?.transporters.length > 1;

  const isForeignCompany = (index: number) =>
    bsd.transporters[index]?.company?.vatNumber &&
    isForeignVat(bsd.transporters[index]?.company?.vatNumber);

  const prefix = (index: number) => (isMultiModal ? `${index + 1} - ` : "");

  const isTransporterProvided =
    bsd.transporters.length >= 1 && !!bsd.transporters[0].company;

  return (
    <PreviewContainer>
      {isTransporterProvided ? (
        bsd.transporters?.map((transporter, idx) => (
          <PreviewContainerRow
            key="idx"
            title={`${prefix(idx)}${transporter?.company?.name}`}
            separator={idx !== 0}
          >
            <PreviewContainerCol gridWidth={3}>
              <PreviewTextRow
                label="Raison sociale"
                value={transporter?.company?.name}
              />

              <PreviewTextRow
                label={
                  !isForeignCompany(idx) ? "SIRET" : "TVA intracommunautaire"
                }
                value={
                  !isForeignCompany(idx)
                    ? transporter?.company?.siret
                    : transporter?.company?.vatNumber
                }
              />

              <PreviewTextRow
                label="Adresse"
                value={transporter?.company?.address}
              />
            </PreviewContainerCol>

            <PreviewContainerCol gridWidth={3}>
              <PreviewCompanyContact company={transporter?.company} />
            </PreviewContainerCol>

            <PreviewContainerCol gridWidth={3}>
              <PreviewTransporterReceiptDetails transporter={transporter} />
            </PreviewContainerCol>

            <PreviewContainerCol gridWidth={3} highlight>
              <PreviewTextRow
                label="Mode de transport"
                value={getTransportModeLabel(transporter?.transport?.mode)}
              />

              <PreviewTextRow
                label="Immatriculation(s)"
                value={
                  transporter?.transport?.plates
                    ? transporter.transport.plates.join(", ")
                    : null
                }
              />

              <PreviewDateRow
                label="Emporté le"
                value={transporter?.transport?.takenOverAt}
              />

              <PreviewTextRow
                label="Signé par"
                value={transporter?.transport?.signature?.author}
              />
            </PreviewContainerCol>
          </PreviewContainerRow>
        ))
      ) : (
        <div>Aucun transporteur n'est visé sur le bordereau.</div>
      )}
    </PreviewContainer>
  );
};

export default BSDAPreviewTransport;
