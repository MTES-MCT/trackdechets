import { StepContainer } from "form/common/stepper/Step";
import StepList from "./BsffStepList";
import React from "react";
import { useParams } from "react-router-dom";
import Emitter from "./Emitter";
import Recipient from "./Destination";
import Transporter from "./Transporter";
import WasteInfo from "./WasteInfo";
import { BsffTypeSelector } from "./BsffTypeSelector";

export default function FormContainer() {
  const { id } = useParams<{ id?: string }>();
  return (
    <main className="main">
      <div className="container">
        <StepList formId={id}>
          {bsff => {
            const emitterSigned =
              bsff?.emitter?.emission?.signature?.author != null;
            const transporterSigned =
              bsff?.transporter?.transport?.signature?.author != null;

            return (
              <>
                <StepContainer
                  component={BsffTypeSelector}
                  title="Type de bordereau"
                />
                <StepContainer
                  component={WasteInfo}
                  title="Détail du déchet"
                  disabled={emitterSigned}
                />
                <StepContainer
                  component={Emitter}
                  title="Émetteur du déchet"
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
