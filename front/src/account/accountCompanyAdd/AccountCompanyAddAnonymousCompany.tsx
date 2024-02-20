import React, { useState } from "react";
import styles from "../AccountCompanyAdd.module.scss";
import { gql, useMutation } from "@apollo/client";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { Mutation, SireneCompanyData } from "@td/codegen-ui";
import { Field, Form, Formik } from "formik";
import Input from "@codegouvfr/react-dsfr/Input";
import InvalidSirenePDFError from "./InvalidSirenePDFError";
import SirenePDFInfo from "./SirenePDFInfo";
import Button from "@codegouvfr/react-dsfr/Button";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../common/config";

const EXTRACT_DATA_FROM_SIRENE = gql`
  mutation ExtractDataFromSirene($pdfInBase64: String!) {
    extractDataFromSirene(pdfInBase64: $pdfInBase64) {
      siret
      name
      codeNaf
      address
      codeCommune
      city
    }
  }
`;

const CREATE_ANONYMOUS_COMPANY = gql`
  mutation CreateAnonymousCompany($input: AnonymousCompanyInput!) {
    createAnonymousCompany(input: $input) {
      id
      name
    }
  }
`;

// https://stackoverflow.com/questions/13538832/convert-pdf-to-a-base64-encoded-string-in-javascript
const convertToBase64 = async (file: File): Promise<string> => {
  return new Promise(res => {
    const fileReader = new FileReader();

    let base64;
    fileReader.onload = function (fileLoadedEvent) {
      base64 = fileLoadedEvent?.target?.result;
      // Remove corrupting leading declaration
      res(base64.replace("data:application/pdf;base64,", ""));
    };

    fileReader.readAsDataURL(file);
  });
};

const AccountCompanyAddAnonymousCompany = () => {
  const [pdfData, setPDFData] = useState<SireneCompanyData>();
  const [
    extractDataFromSirene,
    { error: extractError, loading: extractLoading }
  ] = useMutation<Pick<Mutation, "extractDataFromSirene">, any>(
    EXTRACT_DATA_FROM_SIRENE
  );
  // TODO: redirection on success?
  const [
    createAnonymousCompany,
    { error: createError, loading: createLoading }
  ] = useMutation<Pick<Mutation, "createAnonymousCompany">, any>(
    CREATE_ANONYMOUS_COMPANY,
    {
      // TODO
      onError: () => {
        toast.error("Erreur", {
          duration: TOAST_DURATION
        });
      }
    }
  );

  return (
    <div className={styles.alertWrapper}>
      <SirenePDFInfo />

      <Upload
        className="fr-my-4w"
        label="Avis de situation au répertoire SIRENE"
        hint="au format PDF"
        state="default"
        stateRelatedMessage="Text de validation / d'explication de l'erreur"
        nativeInputProps={{
          onChange: async e => {
            if (e.target && e.target.files && e.target.files.length) {
              // Reset the form
              setPDFData(undefined);

              // Convert to base64
              const file = e.target.files[0];
              const base64 = await convertToBase64(file);

              // Send to backend for data extraction
              const res = await extractDataFromSirene({
                variables: { pdfInBase64: base64 }
              });

              // Fill in form with extracted data
              setPDFData(res.data?.extractDataFromSirene);
            }
          }
        }}
      />

      {pdfData && (
        <Formik
          initialValues={pdfData}
          onSubmit={async values => {
            const { data } = await createAnonymousCompany({
              variables: {
                input: {
                  address: `${values.address} ${values.codeCommune} ${values.city}`,
                  codeCommune: values.codeCommune,
                  codeNaf: values
                    .codeNaf!.replace(".", "")
                    .toUpperCase()
                    .trim(),
                  name: values.name,
                  vatNumber: undefined,
                  siret: values.siret
                }
              }
            });

            if (data) {
              toast.success(
                `L'entreprise "${data?.createAnonymousCompany.name}" est maintenant connue de notre répertoire privé et peut être créée via l'interface.`,
                { duration: TOAST_DURATION }
              );
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className={styles.companyAddForm}>
              <Field name="name">
                {({ field }) => {
                  return (
                    <Input
                      label="Raison sociale"
                      nativeInputProps={field}
                      disabled
                    ></Input>
                  );
                }}
              </Field>

              <Field name="siret">
                {({ field }) => {
                  return (
                    <Input
                      label="Siret"
                      nativeInputProps={field}
                      disabled
                    ></Input>
                  );
                }}
              </Field>

              <Field name="codeNaf">
                {({ field }) => {
                  return (
                    <Input
                      label="Code NAF"
                      nativeInputProps={field}
                      disabled
                    ></Input>
                  );
                }}
              </Field>

              <Field name="address">
                {({ field }) => {
                  return (
                    <Input
                      label="Adresse"
                      nativeInputProps={field}
                      disabled
                    ></Input>
                  );
                }}
              </Field>

              <Field name="codeCommune">
                {({ field }) => {
                  return (
                    <Input
                      label="Code commune"
                      nativeInputProps={field}
                      disabled
                    ></Input>
                  );
                }}
              </Field>

              <Field name="city">
                {({ field }) => {
                  return (
                    <Input
                      label="Ville"
                      nativeInputProps={field}
                      disabled
                    ></Input>
                  );
                }}
              </Field>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer"}
              </Button>
            </Form>
          )}
        </Formik>
      )}

      {extractError && (
        <InvalidSirenePDFError errorMessage={extractError.message} />
      )}
      {createError && (
        <InvalidSirenePDFError errorMessage={createError.message} />
      )}

      {/* <Alert
                title="Etablissement non diffusible"
                severity="error"
                description={
                    <>
                        <span>
                            Nous n'avons pas pu récupérer les informations de cet établissement
                            car il n'est pas diffusible. Veuillez nous contacter via{" "}
                            <a
                                href="https://faq.trackdechets.fr/pour-aller-plus-loin/assistance"
                                target="_blank"
                                rel="noreferrer"
                            >
                                la FAQ
                            </a>{" "}
                            <b>avec</b> votre certificat d'inscription au répertoire des
                            Entreprises et des Établissements (SIRENE) pour pouvoir procéder à
                            la création de l'établissement. Pour télécharger votre certificat,
                            RDV sur{" "}
                        </span>
                        <a
                            href="https://avis-situation-sirene.insee.fr/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            https://avis-situation-sirene.insee.fr/
                        </a>
                    </>
                }
            /> */}
    </div>
  );
};

export default AccountCompanyAddAnonymousCompany;
