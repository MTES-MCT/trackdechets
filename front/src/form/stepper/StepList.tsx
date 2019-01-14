import React, { useState, ReactElement, useEffect, useRef } from "react";
import { Step, IStepContainerProps } from "./Step";
import "./StepList.scss";
import { Formik, FormikActions, setNestedObjectValues } from "formik";
import initialState from "../initial-state";
import { Query, Mutation } from "react-apollo";
import { withRouter, RouteComponentProps } from "react-router";
import { GET_FORM, SAVE_FORM } from "./queries";
import { GET_SLIPS } from "../../dashboard/slips/query";
import { Form } from "../model";
import { formSchema } from "../schema";

interface IProps {
  children: ReactElement<IStepContainerProps>[];
  formId?: string;
}
export default withRouter(function StepList(
  props: IProps & RouteComponentProps
) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = props.children.length - 1;

  useEffect(() => window.scrollTo(0, 0), [currentStep]);

  // When we edit a draft we want to automatically display on error on init
  const formikForm = useRef<any | null>(null);
  useEffect(() => {
    setTimeout(() => {
      if (formikForm.current) {
        const { state, setTouched } = formikForm.current;
        if (
          Object.keys(state.touched).length === 0 &&
          state.values.id != null
        ) {
          setTouched(setNestedObjectValues(state.values, true));
        }
      }
    }, 100);
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
        <Query
          query={GET_FORM}
          variables={{ formId: props.formId }}
          fetchPolicy="network-only"
        >
          {({ loading, error, data }) => {
            if (loading) return <p>Chargement...</p>;
            if (error) return <p>Erreur :(</p>;

            const state = { ...initialState, ...data.form };

            return (
              <Mutation
                mutation={SAVE_FORM}
                update={(store, { data: { saveForm } }) => {
                  const data = store.readQuery<{ forms: Form[] }>({
                    query: GET_SLIPS
                  });
                  if (!data || !data.forms) {
                    return;
                  }
                  data.forms = data.forms.filter(f => f.id !== saveForm.id);
                  data.forms.push(saveForm);
                  store.writeQuery({ query: GET_SLIPS, data });
                }}
              >
                {(saveForm, { loading, error }) => (
                  <Formik
                    ref={formikForm}
                    initialValues={state}
                    validationSchema={formSchema}
                    onSubmit={(values, formikActions: FormikActions<any>) => {
                      saveForm({ variables: { formInput: values } })
                        .then(_ => props.history.push("/dashboard/slips"))
                        .catch(_ => formikActions.setSubmitting(false));
                    }}
                    render={({ handleSubmit }) => {
                      return (
                        <form onSubmit={handleSubmit}>
                          <div
                            onKeyPress={e => {
                              // Disable submit on Enter key press
                              // We prevent it from bubbling further
                              if (e.key === "Enter") {
                                e.preventDefault();
                              }
                            }}
                          >
                            {children}
                          </div>
                        </form>
                      );
                    }}
                  />
                )}
              </Mutation>
            );
          }}
        </Query>
      </div>
    </div>
  );
});
