import * as React from "react";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import { gql, useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import {
  AnonymousCompanyInput,
  Mutation,
  MutationCreateAnonymousCompanyArgs,
} from "generated/graphql/types";
import { InlineError } from "common/components/Error";
import { RedErrorMessage } from "common/components";

const CREATE_ANONYMOUS_COMPANY = gql`
  mutation CreateAnonymousCompany($input: AnonymousCompanyInput!) {
    createAnonymousCompany(input: $input) {
      siret
    }
  }
`;

const AnonymousCompanyInputSchema: yup.SchemaOf<AnonymousCompanyInput> = yup.object(
  {
    address: yup.string().required(),
    codeCommune: yup.string().required(),
    codeNaf: yup.string().required(),
    name: yup.string().required(),
    siret: yup.string().length(14).required(),
  }
);

export function CreateAnonymousCompany() {
  const [createAnonymousCompany, { loading, error }] = useMutation<
    Pick<Mutation, "createAnonymousCompany">,
    MutationCreateAnonymousCompanyArgs
  >(CREATE_ANONYMOUS_COMPANY);

  return (
    <Formik
      initialValues={{
        address: "",
        codeCommune: "",
        codeNaf: "",
        name: "",
        siret: "",
      }}
      validationSchema={AnonymousCompanyInputSchema}
      onSubmit={async values => {
        await createAnonymousCompany({ variables: { input: values } });
        cogoToast.success(
          `L'entreprise au SIRET "${values.siret}" est maintenant connue de notre répertoire privé et peut être créée via l'interface.`,
          { hideAfter: 6 }
        );
      }}
    >
      {() => (
        <Form>
          <div className="form__row">
            <label>
              SIRET
              <Field
                name="siret"
                placeholder="12345678901234"
                className="td-input"
              />
            </label>
            <RedErrorMessage name="siret" />
          </div>
          <div className="form__row">
            <label>
              Nom
              <Field name="name" placeholder="Acme" className="td-input" />
            </label>
            <RedErrorMessage name="name" />
          </div>
          <div className="form__row">
            <label>
              Adresse
              <Field
                name="address"
                placeholder="12 rue de la Liberté"
                className="td-input"
              />
            </label>
            <RedErrorMessage name="address" />
          </div>
          <div className="form__row">
            <label>
              Code NAF
              <Field name="codeNaf" placeholder="8690D" className="td-input" />
            </label>
            <RedErrorMessage name="codeNaf" />
          </div>
          <div className="form__row">
            <label>
              Code commune
              <Field
                name="codeCommune"
                placeholder="69000"
                className="td-input"
              />
            </label>
            <RedErrorMessage name="codeCommune" />
          </div>
          {error && <InlineError apolloError={error} />}
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Création..." : "Créer"}
          </button>
        </Form>
      )}
    </Formik>
  );
}
