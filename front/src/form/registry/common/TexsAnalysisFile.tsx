import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Download } from "@codegouvfr/react-dsfr/Download";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import {
  Mutation,
  MutationCreateTexsAnalysisFileArgs,
  Query,
  QueryRegistryDownloadTexsAnalysisSignedUrlArgs,
  QueryRegistryUploadTexsAnalysisSignedUrlArgs
} from "@td/codegen-ui";
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";

type Props = {
  methods: UseFormReturn<any>;
  disabled?: boolean;
};

const REGISTRY_UPLOAD_TEXS_ANALYSIS_SIGNED_URL = gql`
  query RegistryUploadTexsAnalysisSignedUrl($fileName: String!) {
    registryUploadTexsAnalysisSignedUrl(fileName: $fileName) {
      fileKey
      signedUrl
      fields
    }
  }
`;

const REGISTRY_DOWNLOAD_TEXS_ANALYSIS_SIGNED_URL = gql`
  query RegistryDownloadTexsAnalysisSignedUrl($fileId: String!) {
    registryDownloadTexsAnalysisSignedUrl(fileId: $fileId) {
      fileKey
      signedUrl
      fields
    }
  }
`;

const CREATE_TEXS_ANALYSIS_FILE = gql`
  mutation CreateTexsAnalysisFile($s3FileKey: String!) {
    createTexsAnalysisFile(s3FileKey: $s3FileKey) {
      id
      originalFileName
    }
  }
`;

export function TexsAnalysisFile({ methods, disabled }: Props) {
  const [s3UploadError, setS3UploadError] = useState<string | null>(null);

  const [getSignedUrl, { error: signedUrlError }] = useLazyQuery<
    Pick<Query, "registryUploadTexsAnalysisSignedUrl">,
    Partial<QueryRegistryUploadTexsAnalysisSignedUrlArgs>
  >(REGISTRY_UPLOAD_TEXS_ANALYSIS_SIGNED_URL, {
    fetchPolicy: "no-cache"
  });

  const [createTexsAnalysisFile, { error: createTexsAnalysisFileError }] =
    useMutation<
      Pick<Mutation, "createTexsAnalysisFile">,
      MutationCreateTexsAnalysisFileArgs
    >(CREATE_TEXS_ANALYSIS_FILE);

  const fileId = methods.watch("texsAnalysisFileId");

  const { data: downloadData } = useQuery<
    Pick<Query, "registryDownloadTexsAnalysisSignedUrl">,
    Partial<QueryRegistryDownloadTexsAnalysisSignedUrlArgs>
  >(REGISTRY_DOWNLOAD_TEXS_ANALYSIS_SIGNED_URL, {
    variables: { fileId },
    fetchPolicy: "no-cache",
    skip: !fileId
  });

  const displayName =
    downloadData?.registryDownloadTexsAnalysisSignedUrl.fileKey
      .split("_")
      .slice(2)
      .join("_");

  return (
    <div className="fr-col">
      <h5 className="fr-h5">Caractérisation chimique</h5>

      {fileId ? (
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-md-4">
            <Download
              details="PDF"
              label={displayName}
              linkProps={{
                href: downloadData?.registryDownloadTexsAnalysisSignedUrl
                  .signedUrl
              }}
            />
          </div>
          <div className="fr-col-md-4">
            <Button
              onClick={() => methods.setValue("texsAnalysisFileId", null)}
              priority="secondary"
              disabled={disabled}
            >
              Supprimer
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-12 fr-mb-2w">
              <Upload
                label="Fichier d'analyse (optionnel)"
                hint="Fichier PDF des analyses"
                state="default"
                stateRelatedMessage="Text de validation / d'explication de l'erreur"
                nativeInputProps={{
                  accept: ".pdf",
                  onChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
                    setS3UploadError(null);

                    const file = e.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    const fileName = file.name
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "");

                    const signedUrlResult = await getSignedUrl({
                      variables: { fileName }
                    });

                    if (!signedUrlResult.data) {
                      return;
                    }

                    const {
                      registryUploadTexsAnalysisSignedUrl: {
                        signedUrl,
                        fields,
                        fileKey
                      }
                    } = signedUrlResult.data;

                    const form = new FormData();
                    Object.keys(fields).forEach(key =>
                      form.append(key, fields[key])
                    );
                    form.append("file", file);

                    const uploadResponse = await fetch(signedUrl, {
                      method: "POST",
                      body: form
                    });

                    if (uploadResponse.ok) {
                      const texsAnalysisFile = await createTexsAnalysisFile({
                        variables: {
                          s3FileKey: fileKey
                        }
                      });
                      methods.setValue(
                        "texsAnalysisFileId",
                        texsAnalysisFile.data?.createTexsAnalysisFile.id
                      );
                    } else {
                      setS3UploadError(uploadResponse.statusText);
                    }
                  },
                  disabled: disabled
                }}
              />
            </div>
          </div>

          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-12 fr-mb-2w">
              <Alert
                description="Joindre un PDF ou renseigner le n° DAP, si les analyses sont disponibles."
                severity="info"
                small
              />
              {signedUrlError && (
                <Alert
                  title="Erreur lors de la récupération de l'URL de versement"
                  description={signedUrlError.message}
                  severity="error"
                />
              )}
              {createTexsAnalysisFileError && (
                <Alert
                  title="Erreur lors de l'importation du fichier"
                  description={createTexsAnalysisFileError.message}
                  severity="error"
                />
              )}
              {s3UploadError && (
                <Alert
                  title="Erreur lors du versement du fichier"
                  description={s3UploadError}
                  severity="error"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
