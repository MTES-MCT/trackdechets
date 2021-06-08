import { StepContainer } from "form/common/stepper/Step";
import StepList from "./BsdasriStepList";
import React from "react";
import { useParams } from "react-router-dom";
import Emitter from "./Emitter";
import Recipient from "./Recipient";
import Transporter from "./Transporter";

export default function FormContainer() {
  const { id } = useParams<{ id?: string }>();

  return (
    <main className="main">
      <div className="container">
        <StepList formId={id}>
          {bsdasri => {
            const state = !!bsdasri ? bsdasri["bsdasriStatus"] : "";

            return (
              <>
                <StepContainer
                  component={Emitter}
                  title="PRED"
                  status={state}
                />

                <StepContainer
                  component={Recipient}
                  title="Installation destinataire"
                  status={state}
                />
                <StepContainer
                  component={Transporter}
                  title="Collecteur - Transporteur"
                  status={state}
                />
              </>
            );
          }}
        </StepList>
      </div>
    </main>
  );
}
