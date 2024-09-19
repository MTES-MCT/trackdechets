import { gql, useMutation, useQuery } from "@apollo/client";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Select from "@codegouvfr/react-dsfr/Select";
import Stepper from "@codegouvfr/react-dsfr/Stepper";
import { Upload } from "@codegouvfr/react-dsfr/Upload";
import {
  Mutation,
  MutationImportFileArgs,
  Query,
  QueryRegistryUploadSignedUrlArgs,
  RegistryImportType
} from "@td/codegen-ui";
import React, { useState } from "react";
import { useForm, UseFormGetValues, UseFormRegister } from "react-hook-form";
import { InlineLoader } from "../../Apps/common/Components/Loader/Loaders";
import { Modal } from "../../common/components";

type Props = { isOpen: boolean; onClose: () => void };

type Inputs = {
  type: RegistryImportType;
  files: FileList;
};

type StepProps = {
  getValues: UseFormGetValues<Inputs>;
  register: UseFormRegister<Inputs>;
  goToNextStep: () => void;
};

const steps = [
  { title: "Téléchargement du fichier", component: Step1 },
  { title: "Vérfication", component: Step2 },
  { title: "Importation", component: Step3 }
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

export function ImportModal({ isOpen, onClose }: Props) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
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
        />
      </div>

      <div className="td-modal-actions">
        {currentStepIdx < steps.length - 1 ? (
          <>
            <button
              className="fr-btn fr-btn--secondary"
              onClick={closeAndReset}
            >
              Annuler
            </button>
            <button
              className="fr-btn"
              onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
              disabled={!isValid}
            >
              Valider
            </button>
          </>
        ) : (
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
              dans la <a href="#todo">documentation</a>
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
          Selectionnez une option
        </option>
        <option value="SSD">Sortie de statut de déchet</option>
      </Select>

      <Upload
        hint="Formats supportés: csv, xls, xlsx"
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

function Step2({ getValues, goToNextStep }: StepProps) {
  const [s3UploadError, setS3UploadError] = useState<string | null>(null);

  const { files, type } = getValues();
  const file = files[0];

  const [importFile, { error: importFileError }] = useMutation<
    Pick<Mutation, "importFile">,
    MutationImportFileArgs
  >(IMPORT_FILE, { onCompleted: goToNextStep });

  const { error: signedUrlError } = useQuery<
    Pick<Query, "registryUploadSignedUrl">,
    Partial<QueryRegistryUploadSignedUrlArgs>
  >(REGISTRY_UPLOAD_SIGNED_URL, {
    variables: { fileName: file.name },
    onCompleted: async ({ registryUploadSignedUrl }) => {
      const uploadResponse = await fetch(registryUploadSignedUrl.signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type
        },
        body: file
      });

      if (uploadResponse.ok) {
        await importFile({
          variables: {
            importType: type,
            s3FileKey: registryUploadSignedUrl.fileKey
          }
        });
      } else {
        setS3UploadError(uploadResponse.statusText);
      }
    }
  });

  return (
    <div>
      <Alert
        title="Téléversement du fichier"
        severity="info"
        description="Veuillez patienter pendant que le fichier est téléversé vers Trackdéchets. L'import débutera dans la foulée."
      />
      <InlineLoader />;
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

function Step3() {
  return (
    <div>
      <Alert
        title="Import en cours"
        severity="info"
        description="L'import a démarré. Vous pouvez désormais fermer cette modale et suivre son avancement dans la liste des imports."
      />
    </div>
  );
}
