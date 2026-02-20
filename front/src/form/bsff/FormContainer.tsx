import { StepContainer } from "../common/stepper/Step";
import StepList from "./BsffStepList";
import React from "react";
import { useParams } from "react-router-dom";
import Emitter from "./Emitter";
import Recipient from "./Destination";
import Transporter from "./Transporter";
import WasteInfo from "./WasteInfo";
import { BsffTypeSelector } from "./BsffTypeSelector";

export default function FormContainer() {
  const { id, siret } = useParams<{ id?: string; siret: string }>();

  return (
    <main className="main">
      <div className="container">
        <StepList formId={id}>
          {bsff => {
            const emitterSigned =
              bsff?.emitter?.emission?.signature?.author != null;
            const transporterSigned =
              bsff?.transporter?.transport?.signature?.author != null;
            const isEmitter = bsff?.emitter?.company?.siret === siret;
            // emitter can still update any field after his own signature
            const disabledAfterEmission =
              (emitterSigned && !isEmitter) || transporterSigned;
            const operationSigned =
              bsff?.destination?.reception?.signature?.author != null;
            return (
              <>
                <StepContainer
                  component={BsffTypeSelector}
                  title="Type de bordereau"
                />
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
                  disabled={operationSigned}
                />
              </>
            );
          }}
        </StepList>
      </div>
    </main>
  );
}
