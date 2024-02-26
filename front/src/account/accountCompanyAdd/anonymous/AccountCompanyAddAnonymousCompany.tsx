import React, { useState } from "react";
import styles from "../../AccountCompanyAdd.module.scss";
import { gql, useMutation } from "@apollo/client";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import { Mutation } from "@td/codegen-ui";
import { InvalidSirenePDFError } from "./InvalidSirenePDFError";
import { UploadYourSirenePDFInfo } from "./UploadYourSirenePDFInfo";
import { SirenePDFUploadDisabledFallbackError } from "./SirenePDFUploadDisabledFallbackError";
import { convertFileToBase64 } from "../../../Apps/utils/fileUtils";

const CREATE_ANONYMOUS_COMPANY_REQUEST = gql`
  mutation CreateAnonymousCompanyRequest(
    $input: CreateAnonymousCompanyRequestInput!
  ) {
    createAnonymousCompanyRequest(input: $input)
  }
`;

const AccountCompanyAddAnonymousCompany = ({ siret }: { siret: string }) => {
  const [formatError, setFormatError] = useState<string>();
  const [createAnonymousCompanyRequest, { error, loading }] = useMutation<
    Pick<Mutation, "createAnonymousCompanyRequest">,
    any
  >(CREATE_ANONYMOUS_COMPANY_REQUEST);

  // Because we rely on SIRENE's PDF formats, which may change and break
  // the feature, we keep a fallback to the old-fashioned way, going through
  // the support for each request
  if (import.meta.env.VITE_DISABLE_SIRENE_PDF_UPLOAD == "true") {
    return <SirenePDFUploadDisabledFallbackError />;
  }

  return (
    <div className={styles.alertWrapper}>
      <UploadYourSirenePDFInfo />

      <Upload
        className="fr-my-4w"
        label="Avis de situation au répertoire SIRENE de moins de 3 mois"
        hint="au format PDF"
        state={formatError ? "error" : "default"}
        disabled={loading}
        stateRelatedMessage={formatError}
        nativeInputProps={{
          type: "file",
          accept: ".pdf",
          onChange: async e => {
            if (e.target && e.target.files && e.target.files.length) {
              // Convert to base64
              const file = e.target.files[0];

              // Make sure the file is a PDF
              if (file.name.split(".").pop()?.toLowerCase() !== "pdf") {
                setFormatError("Le fichier doit être au format PDF");
                return;
              }

              setFormatError(undefined);

              const base64 = await convertFileToBase64(file);

              // Send to backend for data extraction
              await createAnonymousCompanyRequest({
                variables: { input: { siret, pdf: base64 } }
              });
            }
          }
        }}
      />

      {error && <InvalidSirenePDFError errorMessage={error.message} />}
    </div>
  );
};

export default AccountCompanyAddAnonymousCompany;
