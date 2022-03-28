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
import {
  isFRVat,
  isSiret,
  isVat,
} from "generated/constants/companySearchHelpers";

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

const AnonymousCompanyInputSchema: yup.SchemaOf<AnonymousCompanyInput> = yup.object(
  {
    address: yup.string().required(),
    codeCommune: yup.string().required(),
    codeNaf: yup.string().required(),
    name: yup.string().required(),
    siret: yup
      .string()
      .ensure()
      .when("vatNumber", (tva, schema) => {
        if (!tva) {
          return schema
            .required(`Anonymous Company : ${MISSING_COMPANY_SIRET}`)
            .test(
              "is-siret",
              "siret n'est pas un numéro de SIRET valide",
              value => isSiret(value)
            );
        }
        return schema.nullable().notRequired();
      }),
    vatNumber: yup
      .string()
      .ensure()
      .test(
        "is-vat",
        "vatNumber n'est pas un numéro de TVA valide",
        value => isVat(value!) && !isFRVat(value!)
      ),
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
              Numéro de TVA intra-communautaire pour les transporteurs
              hors-france
              <Field
                name="vatNumber"
                placeholder="RO12356"
                className="td-input"
              />
            </label>
            <RedErrorMessage name="vatNumber" />
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
