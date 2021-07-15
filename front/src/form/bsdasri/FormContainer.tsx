import { StepContainer } from "form/common/stepper/Step";
import StepList from "./BsdasriStepList";
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import Emitter from "./Emitter";
import Recipient from "./Recipient";
import Transporter from "./Transporter";
import * as queryString from "query-string";

export default function FormContainer() {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const parsed = queryString.parse(location.search);

  const parseStepName = parsed?.step;
  const stepName =
    !!parseStepName && !Array.isArray(parseStepName)
      ? parseStepName
      : "emission";
  const stepMapping = { emission: 0, transport: 1, reception: 2, operation: 2 };

  const initialStep = stepMapping[stepName] || 0;

  return (
    <main className="main">
      <div className="container">
        <StepList formId={id} initialStep={initialStep}>
          {bsdasri => {
            const state = !!bsdasri ? bsdasri["bsdasriStatus"] : "";

            return (
              <>
                <StepContainer
                  component={Emitter}
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
