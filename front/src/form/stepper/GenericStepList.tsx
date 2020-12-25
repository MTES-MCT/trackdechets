import { QueryResult } from "@apollo/client";
import { Formik, setNestedObjectValues } from "formik";
import React, {
  Children,
  createElement,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";

import { Breadcrumb, BreadcrumbItem } from "common/components";
import { InlineError } from "common/components/Error";
import { IStepContainerProps, Step } from "./Step";
import "./StepList.scss";

interface Props {
  children: ReactElement<IStepContainerProps>[];
  formId?: string;
  initialValues: any;
  validationSchema: any;
  formQuery: QueryResult<any, any>;
  onSubmit: (e, values) => void;
}
export default function GenericStepList(props: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = props.children.length - 1;

  const { loading, error } = props.formQuery;

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

  const children = Children.map(props.children, (child, index) => {
    return createElement(
      Step,
      {
        isActive: index === currentStep,
        displayPrevious: currentStep > 0,
        displayNext: currentStep < totalSteps,
        displaySubmit: currentStep === totalSteps,
        goToPreviousStep: () => setCurrentStep(currentStep - 1),
        goToNextStep: () => setCurrentStep(currentStep + 1),
        formId: props.formId,
      },
      child
    );
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <InlineError apolloError={error} />;

  return (
    <div>
      <Breadcrumb>
        {Children.map(props.children, (child, index) => (
          <BreadcrumbItem
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
          </BreadcrumbItem>
        ))}
      </Breadcrumb>
      <div className="step-content">
        <Formik
          innerRef={formikForm}
          initialValues={props.initialValues}
          validationSchema={props.validationSchema}
          onSubmit={() => Promise.resolve()}
        >
          {({ values }) => {
            return (
              <form onSubmit={e => props.onSubmit(e, values)}>
                <div
                  onKeyPress={e => {
                    // Disable submit on Enter key press
                    // We prevent it from bubbling further
                    if (e.key === "Enter") {
                      e.stopPropagation();
                    }
                  }}
                >
                  {children}
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
