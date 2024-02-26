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
import { isSiret, nafCodes } from "@td/constants";
import { TOAST_DURATION } from "../../common/config";
import Input from "@codegouvfr/react-dsfr/Input";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { extractPostalCodeFromAddress } from "../../Apps/utils/utils";
import styles from "./AnonymousCompany.module.scss";

export const MISSING_COMPANY_SIRET = "Le siret de l'entreprise est obligatoire";

const openDataSoftUrl = (postalCode: string) => {
  return `https://public.opendatasoft.com/explore/dataset/correspondance-code-insee-code-postal/table/?flg=fr-fr&q=${postalCode}`;
};

const googleUrl = (postalCode: string) => {
  return `https://www.google.com/search?q=%22code+commune%22+${postalCode}`;
};

const buildLink = (href, label) => {
  return (
    <a
      className={styles.blueFrance}
      rel="noopener noreferrer"
      href={href}
      target="_blank"
    >
      {label}
    </a>
  );
};

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
      .required()
      .test(
        "is-siret",
        "n°SIRET invalide",
        value =>
          !value ||
          isSiret(value, import.meta.env.VITE_ALLOW_TEST_COMPANY === "true")
      )
  });

export function CreateAnonymousCompanyForm({
  anonymousCompanyRequest,
  onCompanyCreated
}) {
  const [createAnonymousCompany, { loading, error }] = useMutation<
    Pick<Mutation, "createAnonymousCompany">,
    MutationCreateAnonymousCompanyArgs
  >(CREATE_ANONYMOUS_COMPANY);

  const postalCode = extractPostalCodeFromAddress(
    anonymousCompanyRequest?.address
  );

  return (
    <>
      <h3 className="fr-h3 fr-mt-2w">
        {anonymousCompanyRequest ? "Vérifier" : "Créer"} une entreprise
      </h3>

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

            onCompanyCreated();
          }
        }}
      >
        {({ errors }) => (
          <Form className="fr-my-3w">
            <Field name="siret">
              {({ field }) => {
                return (
                  <Input
                    label="SIRET"
                    state={errors.siret ? "error" : "default"}
                    stateRelatedMessage={errors.siret as string}
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
                    hintText={
                      postalCode ? (
                        <>
                          Vérifier sur{" "}
                          {buildLink(
                            openDataSoftUrl(postalCode),
                            "OpenDataSoft"
                          )}{" "}
                          ou sur {buildLink(googleUrl(postalCode), "Google")}
                        </>
                      ) : null
                    }
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
                description={"test"}
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
