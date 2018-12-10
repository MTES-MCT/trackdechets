import React, { useState, ReactElement, useEffect } from "react";
import { Step, IStepContainerProps } from "./Step";
import "./StepList.scss";
import { Formik, FormikActions } from "formik";
import initialState from "../initial-state";
import { Query, Mutation } from "react-apollo";
import { withRouter, RouteComponentProps } from "react-router";
import { GET_FORM, SAVE_FORM } from "./queries";

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
              <Mutation mutation={SAVE_FORM}>
                {(saveForm, { loading, error }) => (
                  <Formik
                    initialValues={state}
                    enableReinitialize={false}
                    onSubmit={(values, formikActions: FormikActions<any>) => {
                      saveForm({ variables: { formInput: values } })
                        .then(_ => props.history.push("/dashboard/slips"))
                        .catch(_ => formikActions.setSubmitting(false));
                    }}
                    render={({ handleSubmit }) => (
                      <form onSubmit={handleSubmit}>{children}</form>
                    )}
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
