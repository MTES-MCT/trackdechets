import React from "react";
import TdModal from "../../../Apps/common/Components/Modal/Modal";
import { RegistrySsdForm } from "../../../form/registry/ssd/RegistrySsdForm";

export function FormContainer({ onClose }: { onClose: () => void }) {
  return (
    <TdModal
      onClose={onClose}
      ariaLabel="Fermer"
      closeLabel="Fermer"
      isOpen
      size="TD_SIZE"
      hasFooter={true}
    >
      <RegistrySsdForm onClose={onClose} />
    </TdModal>
  );
}
