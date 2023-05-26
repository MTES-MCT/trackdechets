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
  const { id, siret } = useParams<{ id?: string; siret: string }>();

  const location = useLocation();
  const { step } = queryString.parse(location.search);
  const initialStep = parseInt(String(step), 10) || 0;

  return (
    <main className="main">
      <div className="container">
        <StepList formId={id} initialStep={initialStep}>
          {bsda => {
            const transporterSigned =
              bsda?.transporter?.transport?.signature?.author != null;
            const workerSigned =
              bsda?.worker?.work?.signature?.author != null ||
              transporterSigned;
            const emitterSigned =
              bsda?.emitter?.emission?.signature?.author != null ||
              workerSigned;
            const isEmitter = bsda?.emitter?.company?.siret === siret;
            // emitter can still update any field after his own signature
            const disabledAfterEmission =
              (emitterSigned && !isEmitter) || transporterSigned;

            return (
              <>
                <StepContainer
                  component={Type}
                  title="Type de bordereau"
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={Emitter}
                  title="Émetteur"
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={WasteInfo}
                  title="Détail du déchet"
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={Worker}
                  title="Entreprise de travaux"
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={Transporter}
                  title="Transporteur"
                  disabled={transporterSigned}
                />
                <StepContainer
                  component={Destination}
                  title="Destination"
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
