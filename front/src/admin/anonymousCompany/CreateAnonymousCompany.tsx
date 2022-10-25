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
import { isSiret } from "generated/constants/companySearchHelpers";
import { nafCodes } from "generated/constants/NAF";

export const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";
export const MISSING_COMPANY_VAT =
  "Le numéro de TVA de l'entreprise est obligatoire";

const CREATE_ANONYMOUS_COMPANY = gql`
  mutation CreateAnonymousCompany($input: AnonymousCompanyInput!) {
    createAnonymousCompany(input: $input) {
      siret
      vatNumber
    }
  }
`;

const AnonymousCompanyInputSchema: yup.SchemaOf<AnonymousCompanyInput> =
  yup.object({
    address: yup.string().required(),
    codeCommune: yup.string().required(),
    codeNaf: yup
      .string()
      .oneOf(
        Object.keys(nafCodes),
        "Le code NAF ne fait pas partie de la liste reconnue."
      )
      .required(),
    name: yup.string().required(),
    siret: yup
      .string()
      .ensure()
      .required("n°SIRET requis")
      .test("is-siret", "n°SIRET invalide", value => isSiret(value)),
  });

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
      onSubmit={async (values, { resetForm }) => {
        await createAnonymousCompany({ variables: { input: values } });
        resetForm();
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
