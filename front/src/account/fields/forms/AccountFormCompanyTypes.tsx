import React from "react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { Formik, Field, Form, FormikProps } from "formik";
import CompanyTypes from "../../../login/CompanyType";
import RedErrorMessage from "../../../common/RedErrorMessage";
import styles from "./AccountForm.module.scss";
import { InlineError } from "../../../common/Error";
import {
  CompanyType,
  Mutation,
  MutationUpdateCompanyArgs,
} from "../../../generated/graphql/types";

type Props = {
  name: string;
  siret: string;
  companyTypes: CompanyType[];
  toggleEdition: () => void;
};

type V = {
  companyTypes: CompanyType[];
};

export const UPDATE_COMPANY_TYPES = gql`
  mutation UpdateCompany($siret: String!, $companyTypes: [CompanyType]) {
    updateCompany(siret: $siret, companyTypes: $companyTypes) {
      id
      siret
      companyTypes
    }
  }
`;

export default function AccountFormCompanyTypes({
  name,
  siret,
  companyTypes,
  toggleEdition,
}: Props) {
  const [update, { loading, error }] = useMutation<
    Pick<Mutation, "updateCompany">,
    Pick<MutationUpdateCompanyArgs, "siret" | "companyTypes">
  >(UPDATE_COMPANY_TYPES, {
    onCompleted: () => {
      toggleEdition();
    },
  });

  const initialValues = {} as V;
  initialValues["companyTypes"] = companyTypes;

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values, { setFieldError, setSubmitting }) => {
        update({ variables: { siret, ...values } }).catch(() => {
          setFieldError(name, "Erreur serveur");
          setSubmitting(false);
        });
      }}
      validateOnChange={false}
    >
      {(props: FormikProps<V>) => (
        <Form>
          <div className="form__group">
            <Field
              className={styles.input}
              name={name}
              component={CompanyTypes}
            ></Field>
          </div>
          {loading && <div>Envoi en cours...</div>}

          {props.errors[name] && (
            <RedErrorMessage name="phone">{props.errors[name]}</RedErrorMessage>
          )}
          {error && <InlineError apolloError={error} />}

          <button
            className="button"
            type="submit"
            disabled={props.isSubmitting}
          >
            Valider
          </button>
        </Form>
      )}
    </Formik>
  );
}
