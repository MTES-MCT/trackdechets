import React, { useState } from "react";
import TdModal from "../../../../common/Components/Modal/Modal";
import { CompanyCreateAdminRequestModalStep1 } from "./CompanyCreateAdminRequestModalStep1";
import {
  AdminRequestValidationMethod,
  CompanyCreateAdminRequestModalStep2
} from "./CompanyCreateAdminRequestModalStep2";
import { CompanyCreateAdminRequestModalStep3 } from "./CompanyCreateAdminRequestModalStep3";
import Stepper from "@codegouvfr/react-dsfr/Stepper";
import {
  FormProvider,
  SubmitHandler,
  useForm
} from "react-hook-form";

const steps = [
  {
    title: "Établissement concerné",
    component: CompanyCreateAdminRequestModalStep1,
    buttons: ["CANCEL", "NEXT"]
  },
  {
    title: "Validation au sein de l'établissement",
    component: CompanyCreateAdminRequestModalStep2,
    buttons: ["PREVIOUS", "NEXT"]
  },
  {
    title: "Confirmer la demande",
    component: CompanyCreateAdminRequestModalStep3,
    buttons: ["PREVIOUS", "VALIDATE"]
  }
];

interface CompanyCreateAdminRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateAdminRequestFormInputs {
  companyName: string | null;
  companyOrgId: string | null;
  validationMethod: AdminRequestValidationMethod | null;
  collaboratorEmail: string | null;
}

// TODO: reset form when closing modal
// TODO: ajouter validation
export const CompanyCreateAdminRequestModal = ({
  isOpen,
  onClose
}: CompanyCreateAdminRequestModalProps) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const methods = useForm<CreateAdminRequestFormInputs>({
    defaultValues: {
      companyName: null,
      companyOrgId: null,
      validationMethod: null
    }
  });

  const companyName = methods.watch("companyName");
  const companyOrgId = methods.watch("companyOrgId");
  const validationMethod = methods.watch("validationMethod");
  const collaboratorEmail = methods.watch("collaboratorEmail");

  console.log("values", {
    companyName,
    companyOrgId,
    validationMethod,
    collaboratorEmail
  });

  const onSubmit: SubmitHandler<CreateAdminRequestFormInputs> = () =>
    console.log("submit");

  const closeAndReset = () => {
    setCurrentStepIdx(0);
    methods.reset();
    onClose();
  };

  const StepComponent = steps[currentStepIdx].component;

  return (
    <TdModal
      onClose={closeAndReset}
      title="Demander le droits administrateur"
      ariaLabel="Demander le droits administrateur"
      isOpen={isOpen}
      size="L"
    >
      <div>
        <Stepper
          currentStep={currentStepIdx + 1}
          nextTitle={steps[currentStepIdx + 1]?.title}
          stepCount={steps.length}
          title={steps[currentStepIdx].title}
        />
      </div>

      <div className="fr-mb-2w">
        <ul className="fr-ml-2w" style={{ listStyleType: "disc" }}>
          {companyName && companyOrgId && (
            <li>
              Établissement concerné: {companyName} - {companyOrgId}
            </li>
          )}
          {collaboratorEmail && (
            <li>Collaborateur pouvant valider: {collaboratorEmail}</li>
          )}
        </ul>
      </div>

      <div>
        <FormProvider {...methods}>
          <StepComponent />
        </FormProvider>
      </div>

      <div className="td-modal-actions">
        {steps[currentStepIdx].buttons?.includes("CANCEL") && (
          <button className="fr-btn fr-btn--secondary" onClick={closeAndReset}>
            Annuler
          </button>
        )}
        {steps[currentStepIdx].buttons?.includes("PREVIOUS") && (
          <button
            className="fr-btn"
            onClick={() => setCurrentStepIdx(currentStepIdx - 1)}
          >
            Retour
          </button>
        )}
        {steps[currentStepIdx].buttons?.includes("NEXT") && (
          <button
            className="fr-btn"
            onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
          >
            Suivant
          </button>
        )}
        {steps[currentStepIdx].buttons?.includes("VALIDATE") && (
          <button className="fr-btn" onClick={onSubmit}>
            Envoyer la demande
          </button>
        )}
      </div>
    </TdModal>
  );
};
