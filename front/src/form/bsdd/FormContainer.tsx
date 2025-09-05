import React from "react";
import Emitter from "./Emitter";
import Recipient from "./Recipient";
import { StepContainer } from "../common/stepper/Step";
import StepList from "./StepList";
import Transporter from "./Transporter";
import WasteInfo from "./WasteInfo";
import { useParams } from "react-router-dom";

export default function FormContainer() {
  const { id, siret } = useParams<{ id?: string; siret: string }>();

  return (
    <main className="main">
      <div className="container">
        <StepList formId={id}>
          {form => {
            const isEmitter = form?.emitter?.company?.siret === siret;

            const disabledAfterEmission =
              // le BSDD existe ET
              !!form &&
              // le déchet a été enlevé par le transporteur OU
              (!!form.takenOverAt ||
                // le BSDD a été émis et l'utilisateur courant n'est pas l'émetteur
                (!!form.emittedAt && !isEmitter));

            const disabledAfterTransport = !!form && !!form.takenOverAt;

            return (
              <>
                <StepContainer
                  component={Emitter}
                  title="Émetteur du déchet"
                  form={form}
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={WasteInfo}
                  title="Détail du déchet"
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={Recipient}
                  title="Destination du déchet"
                  disabled={disabledAfterEmission}
                />
                <StepContainer
                  component={Transporter}
                  title="Transporteur du déchet"
                  disabled={disabledAfterTransport}
                />
              </>
            );
          }}
        </StepList>
      </div>
    </main>
  );
}
