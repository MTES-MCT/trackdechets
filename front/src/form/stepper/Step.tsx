import React, { ReactNode } from "react";
import "./Step.scss";

interface IStepProps {
  isActive: boolean;
  displayPrevious: boolean;
  displayNext: boolean;
  displaySubmit: boolean;
  children?: ReactNode;
  goToNextStep: Function;
  goToPreviousStep: Function;
}

export interface IStepContainerProps {
  component?: any;
  children?: JSX.Element;
  title: string;
}
export function StepContainer(props: IStepContainerProps) {
  console.log(props)
  return props.component
    ? React.createElement(props.component)
    : props.children
    ? props.children
    : null;
}

export function Step(props: IStepProps) {
  if (props.isActive === false) return null;

  return (
    <React.Fragment>
      {props.children}
      <div className="step-buttons">
        <Previous
          isActive={props.displayPrevious}
          goToPreviousStep={() => props.goToPreviousStep()}
        />
        <Next
          isActive={props.displayNext}
          goToNextStep={() => props.goToNextStep()}
        />
        <Submit isActive={props.displaySubmit} />
      </div>
    </React.Fragment>
  );
}

function Next(props: { isActive: boolean; goToNextStep: Function }) {
  if (props.isActive === false) return null;

  return (
    <button className="button" onClick={() => props.goToNextStep()}>
      Suivant
    </button>
  );
}

function Previous(props: { isActive: boolean; goToPreviousStep: Function }) {
  if (props.isActive === false) return null;

  return (
    <button
      className="button secondary"
      onClick={() => props.goToPreviousStep()}
    >
      Précédent
    </button>
  );
}

function Submit(props: { isActive: boolean }) {
  if (props.isActive === false) return null;

  return (
    <button className="button" type="submit">
      Enregistrer
    </button>
  );
}
