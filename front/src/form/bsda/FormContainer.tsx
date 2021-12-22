import React from "react";
import * as queryString from "query-string";
import { useLocation, useParams } from "react-router-dom";
import { StepContainer } from "form/common/stepper/Step";

import StepList from "./stepper/BsdaStepList";
import {
  Emitter,
  Destination,
  Transporter,
  Worker,
  WasteInfo,
} from "./stepper/steps";
import { Type } from "./stepper/steps/Type";

export default function FormContainer() {
  const { id } = useParams<{ id?: string }>();

  const location = useLocation();
  const { step } = queryString.parse(location.search);
  const initialStep = parseInt(String(step), 10) || 0;

  return (
    <main className="main">
      <div className="container">
        <StepList formId={id} initialStep={initialStep}>
          {bsda => {
            const emitterSigned =
              bsda?.emitter?.emission?.signature?.author != null;
            const workerSigned = bsda?.worker?.work?.signature?.author != null;
            const transporterSigned =
              bsda?.transporter?.transport?.signature?.author != null;

            return (
              <>
                <StepContainer
                  component={Type}
                  title="Type de bordereau"
                  disabled={emitterSigned}
                />
                <StepContainer
                  component={Emitter}
                  title="Émetteur"
                  disabled={emitterSigned}
                />
                <StepContainer
                  component={WasteInfo}
                  title="Détail du déchet"
                  disabled={emitterSigned}
                />
                <StepContainer
                  component={Worker}
                  title="Entreprise de travaux"
                  disabled={workerSigned}
                />
                <StepContainer
                  component={Transporter}
                  title="Transporteur"
                  disabled={transporterSigned}
                />
                <StepContainer
                  component={Destination}
                  title="Destination"
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
