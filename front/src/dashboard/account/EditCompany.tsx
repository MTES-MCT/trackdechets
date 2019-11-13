import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import CompanyType from "../../login/CompanyType";
import { Mutation } from "@apollo/react-components";
import gql from "graphql-tag";

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($siret: String!, $companyTypes: [CompanyType]) {
    updateCompany(siret: $siret, companyTypes: $companyTypes) {
      id
      siret
      companyTypes
    }
  }
`;

type Props = { siret: string; companyTypes: string[]; onSubmit: () => void };

export default function EditCompany({ siret, companyTypes, onSubmit }: Props) {
  return (
    <div className="account__form">
      <Mutation mutation={UPDATE_COMPANY}>
        {(updateCompany, { loading }) => {
          return (
            <Formik
              initialValues={{ companyTypes }}
              onSubmit={(values, { setSubmitting, setFieldError }) => {
                updateCompany({ variables: { siret, ...values } })
                  .then(_ => {
                    setSubmitting(false);
                    onSubmit();
                  })
                  .catch(_ => {
                    setFieldError(
                      "companyTypes",
                      "Une erreur est survenue. Veuillez réessayer"
                    );
                  });
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <label>Profil de l'entreprise</label>
                  <Field name="companyTypes" component={CompanyType} />
                  <ErrorMessage
                    name="companyTypes"
                    render={msg => <div>{msg}</div>}
                  />
                  {loading && <div>Envoi en cours...</div>}
                  <button
                    type="submit"
                    className="button"
                    disabled={isSubmitting}
                  >
                    Enregistrer
                  </button>
                </Form>
              )}
            </Formik>
          );
        }}
      </Mutation>
    </div>
  );
}
