import React from "react";
import { Bsff, OperationMode, WasteAcceptationStatus } from "@td/codegen-ui";
import {
  PreviewContainer,
  PreviewContainerRow,
  PreviewContainerCol,
  PreviewDateRow,
  PreviewTextRow,
  PreviewCompanyContact
} from "../BSDPreviewComponents";
import { getOperationModeLabel } from "../../../common/operationModes";

interface BSFFPreviewDestinationProps {
  bsd: Bsff;
}

const BSFFPreviewDestination = ({ bsd }: BSFFPreviewDestinationProps) => {
  const isSinglePackaging = bsd.packagings?.length === 1;
  const packaging = isSinglePackaging ? bsd.packagings[0] : undefined;

  const acceptation = packaging?.acceptation;
  const operation = packaging?.operation;

  return (
    <PreviewContainer>
      {/* ================= DESTINATAIRE ================= */}
      <PreviewContainerRow title="Destinataire">
        <PreviewContainerCol gridWidth={3}>
          <PreviewTextRow
            label="Raison sociale"
            value={bsd.destination?.company?.name}
          />
          <PreviewTextRow
            label="SIRET"
            value={bsd.destination?.company?.siret}
          />
          <PreviewTextRow
            label="Adresse"
            value={bsd.destination?.company?.address}
          />
          <PreviewCompanyContact company={bsd.destination?.company} />
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3} highlight>
          <PreviewTextRow
            label="Opération prévue"
            value={bsd.destination?.plannedOperationCode}
          />
          <PreviewTextRow label="CAP" value={bsd.destination?.cap} />
        </PreviewContainerCol>

        {/* ================= ACCEPTATION (mono contenant) ================= */}
        <PreviewContainerCol gridWidth={3}>
          {acceptation && (
            <>
              <PreviewTextRow
                label="Statut d'acceptation"
                value={
                  acceptation.status === WasteAcceptationStatus.Accepted
                    ? "Accepté"
                    : "Refusé"
                }
              />

              <PreviewTextRow
                label={
                  acceptation.status === WasteAcceptationStatus.Accepted
                    ? "Quantité acceptée"
                    : "Quantité refusée"
                }
                value={acceptation.weight}
                units="kg"
              />

              <PreviewTextRow
                label="Code déchet"
                value={acceptation.wasteCode}
              />

              <PreviewTextRow
                label="Description du déchet"
                value={acceptation.wasteDescription}
              />

              {acceptation.status === WasteAcceptationStatus.Refused && (
                <PreviewTextRow
                  label="Raison du refus"
                  value={acceptation.refusalReason}
                />
              )}
            </>
          )}
        </PreviewContainerCol>

        <PreviewContainerCol gridWidth={3} highlight>
          {acceptation && (
            <>
              <PreviewDateRow
                label={
                  acceptation.status === WasteAcceptationStatus.Accepted
                    ? "Accepté le"
                    : "Refusé le"
                }
                value={acceptation.date}
              />

              <PreviewTextRow
                label="Signé par"
                value={acceptation.signature?.author}
              />
            </>
          )}
        </PreviewContainerCol>
      </PreviewContainerRow>

      {/* ================= OPÉRATION ================= */}
      {operation && (
        <PreviewContainerRow title="Traitement" separator>
          <PreviewContainerCol gridWidth={3}>
            <PreviewTextRow label="Opération réalisée" value={operation.code} />

            <PreviewTextRow
              label="Mode de traitement"
              value={getOperationModeLabel(operation.mode as OperationMode)}
            />

            {operation.noTraceability && (
              <PreviewTextRow
                label="Traçabilité"
                value="Rupture de traçabilité"
              />
            )}
          </PreviewContainerCol>

          <PreviewContainerCol gridWidth={3}>
            <PreviewDateRow
              label="Traitement réalisé le"
              value={operation.date}
            />
            <PreviewTextRow
              label="Signé par"
              value={operation.signature?.author}
            />
          </PreviewContainerCol>

          {/* ================= EXUTOIRE ================= */}
          {operation.nextDestination && (
            <PreviewContainerCol gridWidth={6} highlight>
              <PreviewTextRow
                label="Destination ultérieure"
                value={operation.nextDestination.company?.name}
              />
              <PreviewTextRow
                label="SIRET"
                value={operation.nextDestination.company?.siret}
              />
              <PreviewTextRow
                label="Opération ultérieure prévue"
                value={operation.nextDestination.plannedOperationCode}
              />
            </PreviewContainerCol>
          )}
        </PreviewContainerRow>
      )}
    </PreviewContainer>
  );
};

export default BSFFPreviewDestination;
