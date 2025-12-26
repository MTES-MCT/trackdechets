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
import { TOAST_DURATION } from "../../common/config";
import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { CodeCommuneLinks } from "./CodeCommuneLinks";
import { isFRVat, isSiret, isVat, nafCodes } from "@td/constants";
import { envConfig } from "../../common/envConfig";

export const MISSING_COMPANY_SIRET = "Le SIRET de l'entreprise est obligatoire";

const CREATE_ANONYMOUS_COMPANY = gql`
  mutation CreateAnonymousCompany($input: AnonymousCompanyInput!) {
    createAnonymousCompany(input: $input) {
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
        "SIRET invalide",
        value => !value || isSiret(value, envConfig.VITE_ALLOW_TEST_COMPANY)
      )
  });

export function CreateAnonymousCompanyForm() {
  const [createAnonymousCompany, { loading, error }] = useMutation<
    Pick<Mutation, "createAnonymousCompany">,
    MutationCreateAnonymousCompanyArgs
  >(CREATE_ANONYMOUS_COMPANY);

  return (
    <>
      <h3 className="fr-sr-only">Créer une entreprise anonyme</h3>

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
          const { data } = await createAnonymousCompany({
            variables: { input: values }
          });

          resetForm();

          if (data) {
            toast.success(
              `L'entreprise "${data?.createAnonymousCompany.orgId}" est maintenant connue de notre répertoire privé et peut être créée via l'interface.`,
              { duration: TOAST_DURATION }
            );
          }
        }}
      >
        {({ errors, values, setFieldValue }) => (
          <Form>
            <Field name="siret">
              {({ field }) => {
                return (
                  <Input
                    label="SIRET de l'établissement anonyme créé"
                    state={errors.siret ? "error" : "default"}
                    stateRelatedMessage={errors.siret as string}
                    disabled={loading}
                    nativeInputProps={{
                      // force remove whitespace
                      onKeyUp: (e: React.ChangeEvent<HTMLInputElement>) => {
                        const siret = e.target.value
                          .split(" ")
                          .join("")
                          .toUpperCase();
                        setFieldValue("siret", siret);
                      },
                      ...field
                    }}
                  />
                );
              }}
            </Field>

            <Field name="vatNumber">
              {({ field }) => {
                return (
                  <Input
                    label="Numéro de TVA (étranger)"
                    state={errors.vatNumber ? "error" : "default"}
                    stateRelatedMessage={errors.vatNumber as string}
                    disabled={loading}
                    nativeInputProps={field}
                  />
                );
              }}
            </Field>

            <Field name="name">
              {({ field }) => {
                return (
                  <Input
                    label="Nom de l'entreprise"
                    state={errors.name ? "error" : "default"}
                    stateRelatedMessage={errors.name as string}
                    disabled={loading}
                    nativeInputProps={field}
                  />
                );
              }}
            </Field>

            <Field name="address">
              {({ field }) => {
                return (
                  <Input
                    label="Adresse"
                    state={errors.address ? "error" : "default"}
                    stateRelatedMessage={errors.address as string}
                    disabled={loading}
                    nativeInputProps={field}
                  />
                );
              }}
            </Field>

            <Field name="codeNaf">
              {({ field }) => {
                return (
                  <Input
                    label="Code NAF"
                    state={errors.codeNaf ? "error" : "default"}
                    stateRelatedMessage={errors.codeNaf as string}
                    disabled={loading}
                    nativeInputProps={field}
                  />
                );
              }}
            </Field>

            <Field name="codeCommune">
              {({ field }) => {
                return (
                  <Input
                    label="Code commune"
                    hintText={<CodeCommuneLinks address={values.address} />}
                    state={errors.codeCommune ? "error" : "default"}
                    stateRelatedMessage={errors.codeCommune as string}
                    disabled={loading}
                    nativeInputProps={field}
                  />
                );
              }}
            </Field>

            {error && (
              <Alert
                className="fr-mb-3w"
                small
                description={error.message}
                severity="error"
              />
            )}

            <Button
              type="submit"
              priority="primary"
              disabled={
                loading || Object.values(errors).filter(Boolean).length !== 0
              }
            >
              Valider
            </Button>
          </Form>
        )}
      </Formik>
    </>
  );
}
