import React, { ReactNode, createElement } from "react";
import { Link } from "react-router-dom";
import { NextButton, PreviousButton } from "common/components/Buttons";
import "./Step.scss";

interface IStepProps {
  isActive: boolean;
  displayPrevious: boolean;
  displayNext: boolean;
  displaySubmit: boolean;
  children?: ReactNode;
  goToNextStep: Function;
  goToPreviousStep: Function;
  formId?: string;
}

export interface IStepContainerProps {
  component?: any;
  children?: JSX.Element;
  title: string;
}
export function StepContainer(props: IStepContainerProps) {
  return props.component
    ? createElement(props.component)
    : props.children
    ? props.children
    : null;
}

export function Step(props: IStepProps) {
  if (props.isActive === false) return null;
  const submitCaption = props.formId ? "Enregistrer" : "Créer";
  const cancelLink = props.formId ? "/bsds/drafts" : "x";
  return (
    <>
      {props.children}
      <div className="step-buttons form__actions">
        <Previous
          isActive={props.displayPrevious}
          goToPreviousStep={() => props.goToPreviousStep()}
        />

        <Cancel link={cancelLink} />

        <Next
          isActive={props.displayNext}
          goToNextStep={() => props.goToNextStep()}
        />
        <Submit isActive={props.displaySubmit} caption={submitCaption} />
      </div>
    </>
  );
}

function Next(props: { isActive: boolean; goToNextStep: Function }) {
  if (props.isActive === false) return null;

  return <NextButton onClick={props.goToNextStep} />;
}

function Previous(props: { isActive: boolean; goToPreviousStep: Function }) {
  if (props.isActive === false) return null;

  return <PreviousButton onClick={props.goToPreviousStep} />;
}

function Submit(props: { isActive: boolean; caption: string }) {
  if (props.isActive === false) return null;

  return (
    <button className="btn btn--primary" type="submit">
      {props.caption ? props.caption : "Enregistrer"}
    </button>
  );
}

function Cancel(props: { link: string }) {
  return (
    <Link to={props.link}>
      <button className="btn btn--outline-primary">Annuler</button>
    </Link>
  );
}
