import React, { createContext, useState } from "react";
import * as queryString from "query-string";
import { useLocation, useParams } from "react-router-dom";
import { StepContainer } from "../common/stepper/Step";

import StepList from "./stepper/BsdaStepList";
import {
  Emitter,
  Destination,
  Transporter,
  Worker,
  WasteInfo
} from "./stepper/steps";
import { Type } from "./stepper/steps/Type";
import { getBsdaEditionDisabledSteps } from "./utils/getBsdaEditionDisabledSteps";
import { Bsda } from "codegen-ui";

export const BsdaContext = createContext<Bsda | undefined>(undefined);

export default function FormContainer() {
  const { id, siret } = useParams<{ id?: string; siret: string }>();
  const location = useLocation();
  const { step } = queryString.parse(location.search);
  const initialStep = parseInt(String(step), 10) || 0;
  const [bsdaContext, setBsdaContext] = useState<Bsda | undefined>();

  return (
    <main className="main">
      <div className="container">
        <BsdaContext.Provider value={bsdaContext}>
          <StepList formId={id} initialStep={initialStep}>
            {bsda => {
              setBsdaContext(bsda);
              const { disabledAfterEmission, workerSigned, transporterSigned } =
                getBsdaEditionDisabledSteps(bsda, siret);

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
                    disabled={workerSigned}
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
                    disabled={transporterSigned}
                  />
                </>
              );
            }}
          </StepList>
        </BsdaContext.Provider>
      </div>
    </main>
  );
}
