import React, { useState } from "react";
import styles from "../../AccountCompanyAdd.module.scss";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import {
  Mutation,
  Query,
  QueryAnonymousCompanyRequestArgs
} from "@td/codegen-ui";
import { InvalidSirenePDFError } from "./InvalidSirenePDFError";
import { UploadYourSirenePDFInfo } from "./UploadYourSirenePDFInfo";
import { SirenePDFUploadDisabledFallbackError } from "./SirenePDFUploadDisabledFallbackError";
import { convertFileToBase64 } from "../../../Apps/utils/fileUtils";
import { Loader } from "../../../Apps/common/Components";
import { AlreadyPendingAnonymousCompanyRequestError } from "./AlreadyPendingAnonymousCompanyRequestError";
import { InvalidSirenePDFFormatError } from "./InvalidSirenePDFFormatError";
import { AnonymousCompanyRequestCreationSuccess } from "./AnonymousCompanyRequestCreationSuccess";

const ANONYMOUS_COMPANY_REQUEST = gql`
  query AnonymousCompanyRequest($siret: String!) {
    anonymousCompanyRequest(siret: $siret) {
      id
    }
  }
`;

const CREATE_ANONYMOUS_COMPANY_REQUEST = gql`
  mutation CreateAnonymousCompanyRequest(
    $input: CreateAnonymousCompanyRequestInput!
  ) {
    createAnonymousCompanyRequest(input: $input)
  }
`;

// Because we rely on SIRENE's PDF formats, which may change and break
// the feature, we keep a fallback to the old-fashioned way, going through
// the support for each request
const DISABLE_FILE_UPLOAD =
  import.meta.env.VITE_DISABLE_SIRENE_PDF_UPLOAD === "true";

const AccountCompanyAddAnonymousCompany = ({ siret }: { siret: string }) => {
  const [fileHasInvalidFormat, setFileHasInvalidFormat] =
    useState<boolean>(false);
  const { data, loading: getLoading } = useQuery<
    Pick<Query, "anonymousCompanyRequest">,
    QueryAnonymousCompanyRequestArgs
  >(ANONYMOUS_COMPANY_REQUEST, {
    variables: {
      siret
    },
    skip: DISABLE_FILE_UPLOAD
  });
  const [
    createAnonymousCompanyRequest,
    { data: createData, error: createError, loading: createLoading }
  ] = useMutation<Pick<Mutation, "createAnonymousCompanyRequest">, any>(
    CREATE_ANONYMOUS_COMPANY_REQUEST
  );

  if (DISABLE_FILE_UPLOAD) {
    return <SirenePDFUploadDisabledFallbackError />;
  }

  if (getLoading) {
    return <Loader />;
  }

  if (createData?.createAnonymousCompanyRequest) {
    return <AnonymousCompanyRequestCreationSuccess />;
  }

  if (data?.anonymousCompanyRequest) {
    return <AlreadyPendingAnonymousCompanyRequestError />;
  }

  return (
    <div className={styles.alertWrapper}>
      <UploadYourSirenePDFInfo />

      <Upload
        className="fr-my-4w"
        label="Avis de situation au répertoire SIRENE de moins de 3 mois"
        hint="au format PDF"
        state="default"
        disabled={createLoading}
        nativeInputProps={{
          type: "file",
          accept: ".pdf",
          onChange: async e => {
            if (e.target && e.target.files && e.target.files.length) {
              // Convert to base64
              const file = e.target.files[0];

              // Make sure the file is a PDF
              if (file.name.split(".").pop()?.toLowerCase() !== "pdf") {
                setFileHasInvalidFormat(true);
                return;
              }

              setFileHasInvalidFormat(false);

              const base64 = await convertFileToBase64(file);

              // Send to backend for data extraction
              await createAnonymousCompanyRequest({
                variables: { input: { siret, pdf: base64 } }
              });
            }
          }
        }}
      />

      {fileHasInvalidFormat && <InvalidSirenePDFFormatError />}

      {createError && (
        <InvalidSirenePDFError errorMessage={createError.message} />
      )}
    </div>
  );
};

export default AccountCompanyAddAnonymousCompany;
