import { StepContainer } from "../common/stepper/Step";
import StepList from "./BsvhuStepList";
import React from "react";
import { useParams } from "react-router-dom";
import Emitter from "./Emitter";
import Recipient from "./Destination";
import Transporter from "./Transporter";
import WasteInfo from "./WasteInfo";

export default function FormContainer() {
  const { id, siret } = useParams<{ id?: string; siret: string }>();

  return (
    <main className="main">
      <div className="container">
        <StepList formId={id}>
          {vhuForm => {
            const emitterSigned =
              vhuForm?.emitter?.emission?.signature?.author != null;
            const transporterSigned =
              vhuForm?.transporter?.transport?.signature?.author != null;
            const isEmitter = vhuForm?.emitter?.company?.siret === siret;

            // emitter can still update any field after his own signature
            const disabledAfterEmission =
              (emitterSigned && !isEmitter) || transporterSigned;

            return (
              <>
                <StepContainer
                  component={Emitter}
                  title="Émetteur du déchet"
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={WasteInfo}
                  title="Détail du déchet"
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={Transporter}
                  title="Transporteur du déchet"
                  disabled={transporterSigned}
                />
                <StepContainer
                  component={Recipient}
                  title="Destination du déchet"
                  disabled={disabledAfterEmission}
                />
              </>
            );
          }}
        </StepList>
      </div>
    </main>
  );
}
