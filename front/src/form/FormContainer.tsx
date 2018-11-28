import React from "react";
import { StepContainer } from "../stepper/Step";
import StepList from "../stepper/StepList";
import Emitter from "./Emitter";
import Recipient from "./Recipient";
import Transporter from "./Transporter";
import WasteInfo from "./WasteInfo";

export default function FormContainer() {
  return (
    <StepList>
      <StepContainer component={Emitter} title="Emetteur" />
      <StepContainer component={WasteInfo} title="Détail du déchet" />
      <StepContainer component={Recipient} title="Destination" />
      <StepContainer component={Transporter} title="Transporteur" />
    </StepList>
  );
}
