import { gql, useMutation, useQuery } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Select from "@codegouvfr/react-dsfr/Select";
import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import {
  Mutation,
  MutationImportFileArgs,
  Query,
  QueryRegistryImportArgs,
  QueryRegistryUploadSignedUrlArgs,
  RegistryImportStatus,
  RegistryImportType
} from "@td/codegen-ui";
import React, { useState } from "react";
import { useForm, UseFormGetValues, UseFormRegister } from "react-hook-form";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import { Modal } from "../../common/components";
import { pluralize } from "@td/constants";

type Props = { isOpen: boolean; onClose: () => void };

type Inputs = {
  type: RegistryImportType;
  files: FileList;
};

type StepProps = {
  getValues: UseFormGetValues<Inputs>;
  register: UseFormRegister<Inputs>;
  goToNextStep: () => void;
  registryImportId: string | undefined;
  setRegistryImportId: (string) => void;
};

const steps = [
  {
    title: "Sélection du fichier",
    component: Step1,
    buttons: ["CANCEL", "VALIDATE"]
  },
  { title: "Téléversement en cours", component: Step2 },
  { title: "Importation", component: Step3, buttons: ["CLOSE"] }
];

const REGISTRY_UPLOAD_SIGNED_URL = gql`
  query RegistryUploadSignedUrl($fileName: String!) {
    registryUploadSignedUrl(fileName: $fileName) {
      fileKey
      signedUrl
    }
  }
`;

const IMPORT_FILE = gql`
  mutation importFile($importType: RegistryImportType!, $s3FileKey: String!) {
    importFile(importType: $importType, s3FileKey: $s3FileKey) {
      id
    }
  }
`;

const REGISTRY_IMPORT = gql`
  query RegistryImport($id: ID!) {
    registryImport(id: $id) {
      status
      numberOfErrors
      numberOfInsertions
      numberOfEdits
      numberOfCancellations
      numberOfSkipped
    }
  }
`;

export function ImportModal({ isOpen, onClose }: Props) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [registryImportId, setRegistryImportId] = useState<
    string | undefined
  >();
  const {
    register,
    getValues,
    formState: { isValid }
  } = useForm<Inputs>();

  const closeAndReset = () => {
    setCurrentStepIdx(0);
    onClose();
  };

  const StepComponent = steps[currentStepIdx].component;

  return (
    <Modal
      title="Importer un registre"
      ariaLabel="Importer un registre"
      onClose={closeAndReset}
      closeLabel="Annuler"
      isOpen={isOpen}
    >
      <div>
        <Stepper
          currentStep={currentStepIdx + 1}
          nextTitle={steps[currentStepIdx + 1]?.title}
          stepCount={steps.length}
          title={steps[currentStepIdx].title}
        />
      </div>

      <div>
        <StepComponent
          register={register}
          getValues={getValues}
          goToNextStep={() => {
            if (currentStepIdx < steps.length - 1) {
              setCurrentStepIdx(currentStepIdx + 1);
            }
          }}
          registryImportId={registryImportId}
          setRegistryImportId={setRegistryImportId}
        />
      </div>

      <div className="td-modal-actions">
        {steps[currentStepIdx].buttons?.includes("CANCEL") && (
          <button className="fr-btn fr-btn--secondary" onClick={closeAndReset}>
            Annuler
          </button>
        )}
        {steps[currentStepIdx].buttons?.includes("VALIDATE") && (
          <button
            className="fr-btn"
            onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
            disabled={!isValid}
          >
            Valider
          </button>
        )}
        {steps[currentStepIdx].buttons?.includes("CLOSE") && (
          <button className="fr-btn" onClick={closeAndReset}>
            Fermer
          </button>
        )}
      </div>
    </Modal>
  );
}

function Step1({ register }: StepProps) {
  return (
    <div>
      <div className="tw-mb-6">
        <Alert
          title="Format du fichier"
          description={
            <p>
              Vous trouverez de l'aide sur le format de fichier et des exemples
              dans la{" "}
              <a
                href="https://faq.trackdechets.fr/integration-du-rndts-dans-trackdechets/importer-un-registre"
                target="_blank"
                rel="noreferrer"
              >
                documentation
              </a>
            </p>
          }
          severity="info"
        />
      </div>

      <Select
        label="Type de registre à importer"
        nativeSelectProps={{ ...register("type", { required: true }) }}
      >
        <option disabled hidden value="">
          Selectionnez un type d'import
        </option>
        <option value="SSD">Sortie de statut de déchet</option>
        <option value="INCOMING_WASTE">
          Déchets dangereux et non dangereux entrants
        </option>
        <option value="INCOMING_TEXS">
          Terres excavées et sédiments, dangereux et non dangereux entrants
        </option>
        <option value="OUTGOING_WASTE">
          Déchets dangereux et non dangereux sortants
        </option>
        <option value="OUTGOING_TEXS">
          Terres excavées et sédiments, dangereux et non dangereux sortants
        </option>
        <option value="TRANSPORTED">Transportés</option>
        <option value="MANAGED">Gérés</option>
      </Select>

      <Upload
        hint="Formats supportés : csv, xls, xlsx"
        state="default"
        stateRelatedMessage="Text de validation / d'explication de l'erreur"
        nativeInputProps={{
          accept: ".csv, .xls, .xlsx",
          ...register("files", { required: true })
        }}
      />
    </div>
  );
}

function Step2({ getValues, goToNextStep, setRegistryImportId }: StepProps) {
  const [s3UploadError, setS3UploadError] = useState<string | null>(null);

  const { files, type } = getValues();
  const file = files[0];
  const fileName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const [importFile, { error: importFileError }] = useMutation<
    Pick<Mutation, "importFile">,
    MutationImportFileArgs
  >(IMPORT_FILE);

  const displayedAt = Date.now();

  const { error: signedUrlError } = useQuery<
    Pick<Query, "registryUploadSignedUrl">,
    Partial<QueryRegistryUploadSignedUrlArgs>
  >(REGISTRY_UPLOAD_SIGNED_URL, {
    variables: { fileName },
    fetchPolicy: "no-cache",
    onCompleted: async ({ registryUploadSignedUrl }) => {
      const uploadResponse = await fetch(registryUploadSignedUrl.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
          "x-amz-meta-filename": fileName
        },
        body: file
      });

      if (uploadResponse.ok) {
        const registryImport = await importFile({
          variables: {
            importType: type,
            s3FileKey: registryUploadSignedUrl.fileKey
          }
        });

        setRegistryImportId(registryImport?.data?.importFile?.id);

        const minimalWait = 2000; // 2 seconds
        const now = Date.now();
        if (now - displayedAt < minimalWait) {
          await new Promise(resolve =>
            setTimeout(resolve, minimalWait - (now - displayedAt))
          );
        }
        goToNextStep();
      } else {
        setS3UploadError(uploadResponse.statusText);
      }
    }
  });

  return (
    <div>
      <Alert
        title="Envoi du fichier"
        severity="info"
        description="Veuillez patienter pendant que le fichier est téléversé vers Trackdéchets. L'import des déclarations débutera automatiquement à la suite."
      />
      <div className="tw-mt-6">
        <InlineLoader />
      </div>
      {signedUrlError && (
        <Alert
          title="Erreur lors de la récupération de l'URL de versement"
          description={signedUrlError.message}
          severity="error"
        />
      )}
      {importFileError && (
        <Alert
          title="Erreur lors de l'importation du fichier"
          description={importFileError.message}
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
  );
}

function Step3({ registryImportId }) {
  const { data, stopPolling } = useQuery<
    Pick<Query, "registryImport">,
    Partial<QueryRegistryImportArgs>
  >(REGISTRY_IMPORT, {
    variables: { id: registryImportId },
    pollInterval: 5000
  });

  const isStillRunning =
    !data?.registryImport?.status ||
    [RegistryImportStatus.Pending, RegistryImportStatus.Started].includes(
      data.registryImport.status
    );

  const isFailed =
    data?.registryImport?.status &&
    [RegistryImportStatus.Canceled, RegistryImportStatus.Failed].includes(
      data.registryImport.status
    );
  const isSuccessful =
    data?.registryImport?.status === RegistryImportStatus.Successful;
  const isPartiallySuccessful =
    data?.registryImport?.status === RegistryImportStatus.PartiallySuccessful;

  if (!isStillRunning) {
    stopPolling();
  }

  const {
    numberOfErrors = 0,
    numberOfInsertions = 0,
    numberOfEdits = 0,
    numberOfCancellations = 0,
    numberOfSkipped = 0
  } = data?.registryImport || {};

  const stats = [
    [
      numberOfErrors,
      pluralize(
        "ligne n'a pas pu être traitée car elle comporte au moins une erreur",
        numberOfErrors,
        "lignes n'ont pas pu être traitées car elles comportent au moins une erreur"
      )
    ],
    [
      numberOfInsertions,
      pluralize(
        "nouvelle ligne a été importée",
        numberOfInsertions,
        "nouvelles lignes ont été importées"
      )
    ],
    [
      numberOfEdits,
      pluralize(
        "ligne existante a été modifée",
        numberOfEdits,
        "lignes existantes ont été modifées"
      )
    ],
    [
      numberOfCancellations,
      pluralize(
        "ligne existante a été annulée",
        numberOfCancellations,
        "lignes existantes ont été annulées"
      )
    ],
    [
      numberOfSkipped,
      pluralize(
        "ligne a été ignorée (numéro unique déjà déclaré et aucun motif présent)",
        numberOfSkipped,
        "lignes ont été ignorées (numéro unique déjà déclaré et aucun motif présent)"
      )
    ]
  ]
    .map(parts => parts.join(" "))
    .filter(line => !line.startsWith("0"));

  return (
    <div>
      {isStillRunning && (
        <>
          <Alert
            title="Traitement des déclarations"
            severity="info"
            description={
              <>
                <p>L'import est en cours...</p>
                <p>
                  Vous pouvez consulter l'avancement de l'import en restant sur
                  cette fenêtre ou la quitter et suivre son avancement dans la
                  liste des imports.
                </p>
                <ul>
                  {stats.map((stat, idx) => (
                    <li key={idx}>{stat}</li>
                  ))}
                </ul>
              </>
            }
          />
          <div className="tw-mt-6">
            <InlineLoader />
          </div>
        </>
      )}

      {isSuccessful && (
        <Alert
          title="Votre fichier a été importé"
          severity="success"
          description={
            <ul>
              {stats.map((stat, idx) => (
                <li key={idx}>{stat}</li>
              ))}
            </ul>
          }
        />
      )}

      {isPartiallySuccessful && (
        <Alert
          title="Votre fichier a été partiellement importé "
          severity="warning"
          description={
            <ul>
              {stats.map((stat, idx) => (
                <li key={idx}>{stat}</li>
              ))}
            </ul>
          }
        />
      )}

      {isFailed && (
        <Alert
          title="Votre fichier n'a pas pu être importé"
          severity="error"
          description={
            <ul>
              {stats.map((stat, idx) => (
                <li key={idx}>{stat}</li>
              ))}
            </ul>
          }
        />
      )}
    </div>
  );
}
