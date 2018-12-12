import React from "react";
import Emitter from "./Emitter";
import Recipient from "./Recipient";
import { StepContainer } from "./stepper/Step";
import StepList from "./stepper/StepList";
import Transporter from "./Transporter";
import WasteInfo from "./WasteInfo";
import { RouteComponentProps } from "react-router";

export default function FormContainer({
  match
}: RouteComponentProps<{ id: string }>) {
  return (
    <main className="main">
      <div className="container">
        <StepList formId={match.params.id}>
          <StepContainer component={Emitter} title="Emetteur" />
          <StepContainer component={WasteInfo} title="Détail du déchet" />
          <StepContainer component={Recipient} title="Destination" />
          <StepContainer component={Transporter} title="Transporteur" />
        </StepList>
      </div>
    </main>
  );
}
