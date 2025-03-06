import React, { useState } from "react";
import TdModal from "../../../../common/Components/Modal/Modal";
import { CompanyCreateAdminRequestModalStep1 } from "./CompanyCreateAdminRequestModalStep1";
import { CompanyCreateAdminRequestModalStep2 } from "./CompanyCreateAdminRequestModalStep2";
import { CompanyCreateAdminRequestModalStep3 } from "./CompanyCreateAdminRequestModalStep3";
import Stepper from "@codegouvfr/react-dsfr/Stepper";

const steps = [
  {
    title: "Établissement concerné",
    component: CompanyCreateAdminRequestModalStep1,
    buttons: ["CANCEL", "NEXT"]
  },
  {
    title: "Validation au sein de l'établissement",
    component: CompanyCreateAdminRequestModalStep2,
    buttons: ["CANCEL", "NEXT"]
  },
  {
    title: "Confirmer la demande",
    component: CompanyCreateAdminRequestModalStep3,
    buttons: ["CANCEL", "VALIDATE"]
  }
];

interface CompanyCreateAdminRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// TODO: reset form when closing modal
export const CompanyCreateAdminRequestModal = ({
  isOpen,
  onClose
}: CompanyCreateAdminRequestModalProps) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const closeAndReset = () => {
    setCurrentStepIdx(0);
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

      <div className="fr-mb-4w">
        <ul className="fr-ml-2w" style={{ listStyleType: "disc" }}>
          <li>
            Établissement concerné: DREAL nouvelle aquitaine - 1300104570013
          </li>
          <li>
            Collaborateur pouvant valider: Marc Cassin m.cassin@dreal.gouv.fr
          </li>
        </ul>
      </div>

      <div>
        <StepComponent />
      </div>

      <div className="td-modal-actions">
        {steps[currentStepIdx].buttons?.includes("CANCEL") && (
          <button className="fr-btn fr-btn--secondary" onClick={closeAndReset}>
            Annuler
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
          <button className="fr-btn" onClick={closeAndReset}>
            Envoyer la demande
          </button>
        )}
      </div>
    </TdModal>
  );
};
