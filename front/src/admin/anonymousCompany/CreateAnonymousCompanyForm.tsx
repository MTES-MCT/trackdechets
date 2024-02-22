import * as React from "react";
import { Formik, Form, Field } from "formik";
import * as yup from "yup";
import { gql, useMutation, useQuery } from "@apollo/client";
import toast from "react-hot-toast";
import {
  AnonymousCompanyInput,
  Mutation,
  MutationCreateAnonymousCompanyArgs,
  Query,
  QueryAnonymousCompanyRequestArgs
} from "@td/codegen-ui";
import { isSiret, nafCodes } from "@td/constants";
import { TOAST_DURATION } from "../../common/config";
import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { Loader } from "../../Apps/common/Components";
import { useEffect } from "react";
import { PDFViewer } from "./PDFViewer";

export const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";

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

export function CreateAnonymousCompanyForm({ anonymousCompanyRequest }) {
  const [createAnonymousCompany, { loading, error }] = useMutation<
    Pick<Mutation, "createAnonymousCompany">,
    MutationCreateAnonymousCompanyArgs
  >(CREATE_ANONYMOUS_COMPANY);

  return (
    <Formik
      initialValues={{
        address: anonymousCompanyRequest?.address ?? "",
        codeCommune: anonymousCompanyRequest?.codeCommune ?? "",
        codeNaf: anonymousCompanyRequest?.codeNaf ?? "",
        name: anonymousCompanyRequest?.name ?? "",
        siret: anonymousCompanyRequest?.siret ?? ""
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
      {() => (
        <Form className="fr-my-3w">
          <Field name="siret">
            {({ field, error }) => {
              <>{JSON.stringify(field, null, 4)}</>;
              return (
                <Input
                  label="SIRET"
                  state={error ? "error" : "default"}
                  stateRelatedMessage={error?.message}
                  disabled={loading}
                  nativeInputProps={field}
                />
              );
            }}
          </Field>

          <Field name="name">
            {({ field, error }) => {
              return (
                <Input
                  label="Nom de l'entreprise"
                  state={error ? "error" : "default"}
                  stateRelatedMessage={error?.message}
                  disabled={loading}
                  nativeInputProps={field}
                />
              );
            }}
          </Field>

          <Field name="address">
            {({ field, error }) => {
              return (
                <Input
                  label="Adresse"
                  state={error ? "error" : "default"}
                  stateRelatedMessage={error?.message}
                  disabled={loading}
                  nativeInputProps={field}
                />
              );
            }}
          </Field>

          <Field name="codeNaf">
            {({ field, error }) => {
              return (
                <Input
                  label="Code NAF"
                  state={error ? "error" : "default"}
                  stateRelatedMessage={error?.message}
                  disabled={loading}
                  nativeInputProps={field}
                />
              );
            }}
          </Field>

          <Field name="codeCommune">
            {({ field, error }) => {
              return (
                <Input
                  label="Code commune"
                  state={error ? "error" : "default"}
                  stateRelatedMessage={error?.message}
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
              description={"test"}
              severity="error"
            />
          )}

          <Button type="submit" priority="primary" disabled={loading}>
            Valider
          </Button>
        </Form>
      )}
    </Formik>
  );
}
