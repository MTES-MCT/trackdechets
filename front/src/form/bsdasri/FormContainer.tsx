import { StepContainer } from "form/common/stepper/Step";
import StepList from "./BsdasriStepList";
import React from "react";

import { useParams, useLocation } from "react-router-dom";
import Emitter, { RegroupingEmitter } from "./Emitter";

import Recipient from "./Recipient";
import Transporter from "./Transporter";
import * as queryString from "query-string";

type BsdasriFormType = "bsdasri" | "bsdasriRegroup";

export default function FormContainer({
  bsdasriFormType = "bsdasri",
}: {
  bsdasriFormType?: BsdasriFormType;
}) {
  const { id } = useParams<{ id?: string }>();
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
              bsdasri?.bsdasriType === "GROUPING"
                ? RegroupingEmitter
                : Emitter;
            return (
              <>
                <StepContainer
                  component={emitterComponent}
                  title="PRED"
                  status={state}
                  stepName={stepName}
                />
                <StepContainer
                  component={Transporter}
                  title="Collecteur - Transporteur"
                  status={state}
                  stepName={stepName}
                />
                <StepContainer
                  component={Recipient}
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
