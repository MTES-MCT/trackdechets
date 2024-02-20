import React from "react";
import styles from "../AccountCompanyAdd.module.scss";
import { gql, useMutation } from "@apollo/client";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { Mutation } from "@td/codegen-ui";
import InvalidSirenePDFError from "./InvalidSirenePDFError";
import SirenePDFInfo from "./SirenePDFInfo";

const CREATE_ANONYMOUS_COMPANY_REQUEST = gql`
  mutation CreationAnonymousCompanyRequest($pdf: String!) {
    createAnonymousCompanyRequest(pdf: $pdf)
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
  const [creationAnonymousCompanyRequest, { error, loading }] = useMutation<
    Pick<Mutation, "createAnonymousCompanyRequest">,
    any
  >(CREATE_ANONYMOUS_COMPANY_REQUEST);

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
              // Convert to base64
              const file = e.target.files[0];
              const base64 = await convertToBase64(file);

              // Send to backend for data extraction
              const res = await creationAnonymousCompanyRequest({
                variables: { pdf: base64 }
              });
            }
          }
        }}
      />

      {error && <InvalidSirenePDFError errorMessage={error.message} />}

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
