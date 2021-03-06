import { StepContainer } from "form/common/stepper/Step";
import StepList from "./BsvhuStepList";
import React from "react";
import { useParams } from "react-router-dom";
import Emitter from "./Emitter";
import Recipient from "./Destination";
import Transporter from "./Transporter";
import WasteInfo from "./WasteInfo";

export default function FormContainer() {
  const { id } = useParams<{ id?: string }>();
  return (
    <main className="main">
      <div className="container">
        <StepList formId={id}>
          {vhuForm => {
            const emitterSigned =
              vhuForm?.emitter?.emission?.signature?.author != null;
            const transporterSigned =
              vhuForm?.transporter?.transport?.signature?.author != null;

            return (
              <>
                <StepContainer
                  component={Emitter}
                  title="Émetteur du déchet"
                  disabled={emitterSigned}
                />
                <StepContainer
                  component={WasteInfo}
                  title="Détail du déchet"
                  disabled={emitterSigned}
                />
                <StepContainer
                  component={Transporter}
                  title="Transporteur du déchet"
                  disabled={transporterSigned}
                />
                <StepContainer
                  component={Recipient}
                  title="Destination du déchet"
                  disabled={emitterSigned}
                />
              </>
            );
          }}
        </StepList>
      </div>
    </main>
  );
}
