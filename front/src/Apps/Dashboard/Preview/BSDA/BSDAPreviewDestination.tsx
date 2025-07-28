import React from "react";
import {
  Bsda,
  BsvhuStatus,
  OperationMode,
  WasteAcceptationStatus
} from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewCompanyContact
} from "../BSDPreviewComponents";
import { getVerboseAcceptationStatus } from "../BSDPreviewUtils";
import { getOperationModeLabel } from "../../../common/operationModes";

interface BSDAPreviewDestinationProps {
  bsd: Bsda;
}
const BSDAPreviewDestination = ({ bsd }: BSDAPreviewDestinationProps) => {
  return (
    <PreviewContainer>
      <PreviewContainerRow title={"Destinataire"}>
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Raison sociale"
            value={bsd.destination?.company?.name}
          />

          <PreviewTextRow
            label="Siret"
            value={bsd.destination?.company?.siret}
          />

          <PreviewTextRow
            label="Adresse"
            value={bsd.destination?.company?.address}
          />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewCompanyContact company={bsd.destination?.company} />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Refus"
            value={getVerboseAcceptationStatus(
              bsd.destination?.reception?.acceptationStatus
            )}
          />

          <PreviewTextRow
            label="Poids réceptionné net"
            value={bsd.destination?.reception?.weight}
            units="tonne(s)"
          />

          <PreviewTextRow
            label="Poids refusé net"
            value={bsd.destination?.reception?.refusedWeight}
            units="tonne(s)"
          />

          <PreviewTextRow
            label="Poids traité net"
            value={bsd.destination?.reception?.acceptedWeight}
            units="tonne(s)"
          />

          <PreviewTextRow
            label="Opération réalisée"
            value={bsd.destination?.operation?.code}
          />

          <PreviewTextRow
            label="Mode de traitement réalisé"
            value={getOperationModeLabel(
              bsd.destination?.operation?.mode as OperationMode
            )}
          />

          <PreviewTextRow label="CAP" value={bsd.destination?.cap} />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3} highlight>
          <PreviewDateRow
            label={
              bsd.destination?.reception?.acceptationStatus ===
              WasteAcceptationStatus.Refused
                ? "Reçu et refusé le"
                : "Reçu et accepté le"
            }
            value={bsd.destination?.reception?.date}
          />

          <PreviewTextRow
            label="Signé par"
            value={bsd.destination?.reception?.signature?.author}
          />

          <PreviewDateRow
            label="Traité le"
            value={bsd.destination?.operation?.date}
          />

          <PreviewTextRow
            label="Signé par"
            value={bsd.destination?.operation?.signature?.author}
          />
        </PreviewContainerCol>
      </PreviewContainerRow>

      {bsd.destination?.operation?.nextDestination && (
        <PreviewContainerRow title={"Exutoire final"} separator>
          <PreviewContainerCol gridWidth={3}>
            <PreviewTextRow
              label="Raison sociale"
              value={bsd.destination?.operation?.nextDestination.company?.name}
            />

            <PreviewTextRow
              label="Siret"
              value={bsd.destination?.operation?.nextDestination.company?.siret}
            />

            <PreviewTextRow
              label="Adresse"
              value={
                bsd.destination?.operation?.nextDestination.company?.address
              }
            />
          </PreviewContainerCol>

          <PreviewContainerCol gridWidth={3}>
            <PreviewCompanyContact
              company={bsd.destination?.operation.nextDestination.company}
            />
          </PreviewContainerCol>

          <PreviewContainerCol gridWidth={3}>
            <PreviewTextRow
              label="Traitement ultérieur prévu"
              value={
                bsd.destination.operation.nextDestination.plannedOperationCode
              }
            />

            <PreviewTextRow
              label="CAP"
              value={bsd.destination?.operation.nextDestination.cap}
            />
          </PreviewContainerCol>
        </PreviewContainerRow>
      )}
    </PreviewContainer>
  );
};

export default BSDAPreviewDestination;
