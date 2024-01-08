import React from "react";
import { Formik, Form, Field } from "formik";
import { gql, useMutation } from "@apollo/client";
import RedErrorMessage from "../../../common/components/RedErrorMessage";
import styles from "./AccountForm.module.scss";
import * as yup from "yup";
import { CompanyPrivate, MutationVerifyCompanyArgs } from "@td/codegen-ui";

type Props = {
  siret: string;
  toggleEdition: () => void;
};

const VERIFY_COMPANY = gql`
  mutation VerifyCompany($input: VerifyCompanyInput!) {
    verifyCompany(input: $input) {
      id
      verificationStatus
    }
  }
`;

const yupSchema = yup.object().shape({
  code: yup.string().required()
});

export default function AccountFormVerifyCompany({
  siret,
  toggleEdition
}: Props) {
  const [verifyCompany, { loading }] = useMutation<
    CompanyPrivate,
    MutationVerifyCompanyArgs
  >(VERIFY_COMPANY, {
    onCompleted: () => {
      toggleEdition();
    }
  });

  const initialValues = { code: "" };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={(values, { setFieldError, setSubmitting }) => {
        const variables = { input: { ...values, siret } };
        verifyCompany({ variables }).catch(err => {
          setFieldError("code", err.message || "Erreur serveur");
          setSubmitting(false);
        });
      }}
      validateOnChange={false}
      validationSchema={yupSchema}
    >
      {props => (
        <Form>
          <div className="form__row">
            <Field
              className={`td-input ${styles.input}`}
              type="text"
              name="code"
              placeholder="Code de vérification"
            />
          </div>
          {loading && <div>Envoi en cours...</div>}

          <RedErrorMessage name="code" />

          <button
            className="btn btn--primary tw-mt-4"
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
