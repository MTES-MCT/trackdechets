import { QueryResult } from "@apollo/client";
import { Formik, setNestedObjectValues } from "formik";
import React, {
  Children,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import { useHistory } from "react-router-dom";
import { Stepper, StepperItem } from "common/components";
import { InlineError } from "Apps/common/Components/Error/Error";
import "./GenericStepList.scss";
import { IStepContainerProps } from "./Step";

interface Props {
  children: ReactElement<IStepContainerProps>[];
  formId?: string;
  initialValues: any;
  validationSchema: any;
  initialStep?: number;
  formQuery: QueryResult<any, any>;
  onSubmit: (values) => void;
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
  const history = useHistory();

  const steps = Children.toArray(children);
  const totalSteps = steps.length;
  const [currentStep, setCurrentStep] = useState(
    initialStep <= totalSteps ? initialStep : 0
  );
  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  const { loading, error } = formQuery;

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

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
    values: unknown
  ) {
    event.preventDefault();

    if (isLastStep) {
      onSubmit(values);
    } else {
      setCurrentStep(currentStep + 1);
    }
  }

  function previous() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      history.goBack();
    }
  }

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
          onSubmit={() => Promise.resolve()} // To skip formik validation upon submit (=allow drafts) we use a custom submit handler
        >
          {({ values }) => (
            <form onSubmit={e => handleSubmit(e, values)}>
              {step}
              <div className="step-buttons form__actions">
                <button
                  className="btn btn--outline-primary"
                  type="button"
                  onClick={() => previous()}
                >
                  {currentStep === 0 ? "Annuler" : "Précédent"}
                </button>

                <button className="btn btn--primary" type="submit">
                  {!isLastStep ? "Suivant" : formId ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
}
