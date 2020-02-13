import { useMutation, useQuery } from "@apollo/react-hooks";
import cogoToast from "cogo-toast";
import { Formik, setNestedObjectValues } from "formik";
import React, { ReactElement, useEffect, useRef, useState } from "react";
import { RouteComponentProps, withRouter } from "react-router";
import { updateApolloCache } from "../../common/helper";
import { currentSiretService } from "../../dashboard/CompanySelector";
import { GET_SLIPS } from "../../dashboard/slips/query";
import initialState from "../initial-state";
import { Form } from "../model";
import { formSchema } from "../schema";
import { GET_FORM, SAVE_FORM } from "./queries";
import { IStepContainerProps, Step } from "./Step";
import "./StepList.scss";

interface IProps {
  children: ReactElement<IStepContainerProps>[];
  formId?: string;
}
export default withRouter(function StepList(
  props: IProps & RouteComponentProps
) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = props.children.length - 1;

  const { loading, error, data } = useQuery(GET_FORM, {
    variables: { formId: props.formId },
    fetchPolicy: "network-only"
  });

  const [saveForm] = useMutation(SAVE_FORM, {
    update: (store, { data: { saveForm } }) => {
      updateApolloCache<{ forms: Form[] }>(store, {
        query: GET_SLIPS,
        variables: { siret: currentSiretService.getSiret() },
        getNewData: data => ({
          forms: [...data.forms.filter(f => f.id !== saveForm.id), saveForm]
        })
      });
    }
  });

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

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur :(</p>;

  const state = { ...initialState, ...data.form };
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
          innerRef={formikForm}
          initialValues={state}
          validationSchema={formSchema}
          onSubmit={() => Promise.resolve()}
        >
          {({ values }) => {
            return (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  // As we want to be able to save draft, we skip validation on submit
                  // and don't use the classic Formik mechanism
                  saveForm({
                    variables: { formInput: values }
                  })
                    .then(_ => props.history.push("/dashboard/slips"))
                    .catch(err => {
                      cogoToast.error(
                        err.message.replace("GraphQL error:", ""),
                        { hideAfter: 7 }
                      );
                    });
                  return false;
                }}
              >
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
});
