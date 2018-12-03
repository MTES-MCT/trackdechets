import React, { useState, ReactElement, useEffect } from "react";
import { Step, IStepContainerProps } from "./Step";
import "./StepList.scss";
import { Formik } from "formik";
import initialState from "../initial-state";

interface IProps {
  children: ReactElement<IStepContainerProps>[];
}
export default function StepList(props: IProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = props.children.length - 1;

  useEffect(() => window.scrollTo(0, 0), [currentStep]);

  const children = React.Children.map(props.children, (child, index) => {
    return React.createElement(
      Step,
      {
        isActive: index === currentStep,
        displayPrevious: currentStep > 0,
        displayNext: currentStep < totalSteps,
        displaySubmit: currentStep === totalSteps,
        goToPreviousStep: () => setCurrentStep(currentStep - 1),
        goToNextStep: () => setCurrentStep(currentStep + 1)
      },
      child
    );
  });

  return (
    <div>
      <ul className="step-header">
        {React.Children.map(props.children, (child, index) => (
          <li
            className={
              index === currentStep
                ? "is-active"
                : currentStep > index
                ? "is-complete"
                : ""
            }
            onClick={() => setCurrentStep(index)}
          >
            <span>{child.props.title}</span>
          </li>
        ))}
      </ul>
      <div className="step-content">
        <Formik
          initialValues={initialState}
          enableReinitialize={false}
          validate={values => console.log("validate", values)}
          onSubmit={values => console.log("sumbit", values)}
          render={({ values, handleSubmit, isSubmitting, handleReset }) => (
            <form onSubmit={handleSubmit}>{children}</form>
          )}
        />
      </div>
    </div>
  );
}
