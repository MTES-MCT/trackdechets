import { StepContainer } from "../common/stepper/Step";
import StepList from "./BsdasriStepList";
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import Emitter from "./steps/Emitter";
import Destination from "./steps/Destination";
import * as queryString from "query-string";

import Transporter, {
  TransporterShowingTakeOverFields
} from "./steps/Transporter";
import { Type } from "./steps/Type";

export default function FormContainer() {
  const { id, siret } = useParams<{ id?: string; siret: string }>();
  const location = useLocation();
  const parsed = queryString.parse(location.search);

  const parseStepName = parsed?.step;
  const stepName =
    !!parseStepName && !Array.isArray(parseStepName) ? parseStepName : "";
  const stepMapping = {
    type: 0,
    emission: 1,
    transport: 2,
    reception: 3,
    operation: 4
  };

  const initialStep = stepMapping[stepName] || 0;

  return (
    <main className="main">
      <div className="container">
        <StepList formId={id} initialStep={initialStep}>
          {bsdasri => {
            const state = !!bsdasri ? bsdasri["bsdasriStatus"] : "";
            // Use a tweaked emitter component when creating or updating a grouping bsdasri

            // When transporter proceeds to direct takeover, form has to display some transporter tab fields
            // which are usually not displayed yet
            const TransporterComponent =
              state === "INITIAL" &&
              !bsdasri?.isDraft &&
              siret === bsdasri?.transporter?.company?.orgId
                ? TransporterShowingTakeOverFields
                : Transporter;
            // associated bsd can't be edited
            const editionDisabled = !!bsdasri?.synthesizedIn?.id;

            return (
              <>
                <StepContainer
                  component={Type}
                  title="Type de bordereau"
                  status={state}
                  stepName={stepName}
                  disabled={!!bsdasri?.id}
                />
                <StepContainer
                  component={Emitter}
                  title="PRED"
                  status={state}
                  stepName={stepName}
                  disabled={editionDisabled}
                />
                <StepContainer
                  component={TransporterComponent}
                  title="Collecteur - Transporteur"
                  status={state}
                  stepName={stepName}
                  disabled={editionDisabled}
                />
                <StepContainer
                  component={Destination}
                  title="Installation destinataire"
                  status={state}
                  stepName={stepName}
                  disabled={editionDisabled}
                />
              </>
            );
          }}
        </StepList>
      </div>
    </main>
  );
}
