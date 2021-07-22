import { QueryResult } from "@apollo/client";
import { Stepper, StepperItem } from "common/components";
import { InlineError } from "common/components/Error";
import { Formik, setNestedObjectValues } from "formik";
import React, {
  Children,
  createElement,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { IStepContainerProps, Step } from "./Step";
import "./GenericStepList.scss";

interface Props {
  children: ReactElement<IStepContainerProps>[];
  formId?: string;
  initialValues: any;
  validationSchema: any;
  initialStep?: number;
  formQuery: QueryResult<any, any>;
  onSubmit: (e, values) => void;
}
export default function GenericStepList({
  children,
  formId,
  formQuery,
  onSubmit,
  initialValues,
  validationSchema,
  initialStep = 0,
}: Props) {
  const totalSteps = children.length - 1;
  const [currentStep, setCurrentStep] = useState(
    initialStep <= totalSteps ? initialStep : 0
  );

  const { loading, error } = formQuery;

  useEffect(() => window.scrollTo(0, 0), [currentStep]);

  // When we edit a draft we want to automatically display on error on init
  const formikForm: any = useRef();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formikForm.current) {
        const { touched, values, setTouched } = formikForm.current;
        if (Object.keys(touched).length === 0 && values.id != null) {
          setTouched(setNestedObjectValues(values, true));
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  });

  const childrenComponents = Children.map(children, (child, index) => {
    return createElement(
      Step,
      {
        isActive: index === currentStep,
        displayPrevious: currentStep > 0,
        displayNext: currentStep < totalSteps,
        displaySubmit: currentStep === totalSteps,
        goToPreviousStep: () => setCurrentStep(currentStep - 1),
        goToNextStep: () => setCurrentStep(currentStep + 1),
        formId: formId,
      },
      child
    );
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <InlineError apolloError={error} />;
  return (
    <div>
      <Stepper>
        {Children.map(children, (child, index) => (
          <StepperItem
            variant={
              index === currentStep
                ? "active"
                : currentStep > index
                ? "complete"
                : "normal"
            }
            onClick={() => setCurrentStep(index)}
          >
            <span>{child.props.title}</span>
          </StepperItem>
        ))}
      </Stepper>
      <div className="step-content">
        <Formik
          innerRef={formikForm}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={() => Promise.resolve()}
        >
          {({ values }) => {
            return (
              <form onSubmit={e => onSubmit(e, values)}>
                <div
                  onKeyPress={e => {
                    // Disable submit on Enter key press
                    // We prevent it from bubbling further
                    if (e.key === "Enter") {
                      e.stopPropagation();
                    }
                  }}
                >
                  {childrenComponents}
                </div>
              </form>
            );
          }}
        </Formik>
      </div>
    </div>
  );
}

/**
 * Construct the form state by merging initialState and the actual form.
 * The actual form may include properties that do not belong to the form.
 * If we keep them in the form state they will break the mutation validation.
 * To avoid that, we make sure that every properties we keep is a property contained in initial state.
 *
 * @param initialState what an empty Form is
 * @param actualForm the actual form
 */
export function getComputedState(initialState, actualForm) {
  if (!actualForm) {
    return initialState;
  }

  const startingObject = actualForm.id ? { id: actualForm.id } : {};

  return Object.keys(initialState).reduce((prev, curKey) => {
    const initialValue = initialState[curKey];
    if (
      typeof initialValue === "object" &&
      initialValue !== null &&
      !(initialValue instanceof Array)
    ) {
      prev[curKey] = getComputedState(initialValue, actualForm[curKey]);
    } else {
      prev[curKey] = actualForm[curKey] ?? initialValue;
    }

    return prev;
  }, startingObject);
}
