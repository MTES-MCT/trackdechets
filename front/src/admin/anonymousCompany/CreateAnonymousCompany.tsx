import * as React from "react";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import { gql, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import {
  AnonymousCompanyInput,
  Mutation,
  MutationCreateAnonymousCompanyArgs
} from "@td/codegen-ui";
import { InlineError } from "../../Apps/common/Components/Error/Error";
import { RedErrorMessage } from "../../common/components";
import { isFRVat, isSiret, isVat, nafCodes } from "@td/constants";
import { TOAST_DURATION } from "../../common/config";

export const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";
export const MISSING_COMPANY_VAT =
  "Le numéro de TVA de l'entreprise est obligatoire";

const CREATE_ANONYMOUS_COMPANY = gql`
  mutation createAnonymousCompany($input: AnonymousCompanyInput!) {
    createAnonymousCompanyByAdmin(input: $input) {
      orgId
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
    vatNumber: yup
      .string()
      .nullable()
      .test(
        "is-vat",
        ({ originalValue }) =>
          `AnonymousCompany: ${originalValue} n'est pas un numéro de TVA valide`,
        value => !value || isVat(value)
      )
      .test(
        "is-not-fr-vat",
        "AnonymousCompany: impossible de soumettre un numéro de TVA français, seul le SIRET est autorisé",
        value => !value || !isFRVat(value)
      ),
    siret: yup
      .string()
      .when("vatNumber", {
        is: vatNumber => !vatNumber,
        then: schema => schema.required(),
        otherwise: schema => schema.ensure()
      })
      .test(
        "is-siret",
        "n°SIRET invalide",
        value =>
          !value ||
          isSiret(value, import.meta.env.VITE_ALLOW_TEST_COMPANY === "true")
      )
  });

export function createAnonymousCompany() {
  const [createAnonymousCompanyByAdmin, { loading, error }] = useMutation<
    Pick<Mutation, "createAnonymousCompanyByAdmin">,
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
        vatNumber: ""
      }}
      validationSchema={AnonymousCompanyInputSchema}
      onSubmit={async (values, { resetForm }) => {
        const { data } = await createAnonymousCompanyByAdmin({
          variables: { input: values }
        });
        resetForm();
        if (data) {
          toast.success(
            `L'entreprise "${data?.createAnonymousCompanyByAdmin.orgId}" est maintenant connue de notre répertoire privé et peut être créée via l'interface.`,
            { duration: TOAST_DURATION }
          );
        }
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
              Numéro de TVA (pour les entreprises étrangères uniquement)
              <Field
                name="vatNumber"
                placeholder="BE123456"
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
