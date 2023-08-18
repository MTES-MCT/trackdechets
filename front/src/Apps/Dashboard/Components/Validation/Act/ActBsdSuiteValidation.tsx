import TdModal from "Apps/common/Components/Modal/Modal";
import React from "react";
import MarkAsResealedModalContent from "../../../../../dashboard/components/BSDList/BSDD/WorkflowAction/MarkAsResealedModalContent";

const ActBsdSuiteValidation = ({ bsd, isOpen, onClose }) => {
  return (
    <TdModal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Compléter le BSD suite"
    >
      <h2 className="td-modal-title">Compléter le BSD suite</h2>
      <MarkAsResealedModalContent bsd={bsd} onClose={onClose} />
    </TdModal>
  );
};

export default ActBsdSuiteValidation;
