import { StepContainer } from "form/common/stepper/Step";
import StepList from "./BsdasriStepList";
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import Emitter, { RegroupingEmitter } from "./Emitter";
import Destination from "./Destination";
import * as queryString from "query-string";

import Transporter, { TransporterShowingTakeOverFields } from "./Transporter";

type BsdasriFormType = "bsdasri" | "bsdasriRegroup";

export default function FormContainer({
  bsdasriFormType = "bsdasri",
}: {
  bsdasriFormType?: BsdasriFormType;
}) {
  const { id, siret } = useParams<{ id?: string; siret: string }>();
  const location = useLocation();
  const parsed = queryString.parse(location.search);

  const parseStepName = parsed?.step;
  const stepName =
    !!parseStepName && !Array.isArray(parseStepName) ? parseStepName : "";
  const stepMapping = { emission: 0, transport: 1, reception: 2, operation: 2 };

  const initialStep = stepMapping[stepName] || 0;

  return (
    <main className="main">
      <div className="container">
        <StepList
          formId={id}
          initialStep={initialStep}
          bsdasriFormType={bsdasriFormType}
        >
          {bsdasri => {
            const state = !!bsdasri ? bsdasri["bsdasriStatus"] : "";
            // Use a tweaked emitter component when creating or updating a grouping bsdasri
            const emitterComponent =
              bsdasriFormType === "bsdasriRegroup" ||
              bsdasri?.type === "GROUPING"
                ? RegroupingEmitter
                : Emitter;

            // When transporter proceeds to direct takeover, form has to display some transporter tab fields
            // which are usually not displayed yet
            const transporterComponent =
              state === "INITIAL" &&
              !bsdasri?.isDraft &&
              siret === bsdasri?.transporter?.company?.siret
                ? TransporterShowingTakeOverFields
                : Transporter;

            return (
              <>
                <StepContainer
                  component={emitterComponent}
                  title="PRED"
                  status={state}
                  stepName={stepName}
                />
                <StepContainer
                  component={transporterComponent}
                  title="Collecteur - Transporteur"
                  status={state}
                  stepName={stepName}
                />
                <StepContainer
                  component={Destination}
                  title="Installation destinataire"
                  status={state}
                  stepName={stepName}
                />
              </>
            );
          }}
        </StepList>
      </div>
    </main>
  );
}
