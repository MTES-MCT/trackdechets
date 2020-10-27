import React from "react";
import Emitter from "./Emitter";
import Recipient from "./Recipient";
import { StepContainer } from "./stepper/Step";
import StepList from "./stepper/StepList";
import Transporter from "./Transporter";
import WasteInfo from "./WasteInfo";
import { useParams } from "react-router";

export default function FormContainer() {
  const { id } = useParams<{ id?: string }>();
  return (
    <main className="main">
      <div className="container">
        <StepList formId={id}>
          <StepContainer component={Emitter} title="Émetteur du déchet" />
          <StepContainer component={WasteInfo} title="Détail du déchet" />
          <StepContainer component={Recipient} title="Destination du déchet" />
          <StepContainer
            component={Transporter}
            title="Transporteur du déchet"
          />
        </StepList>
      </div>
    </main>
  );
}
