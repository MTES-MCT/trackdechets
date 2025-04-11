import React from "react";
import { useNavigate } from "react-router-dom";
import TdModal from "../../../Apps/common/Components/Modal/Modal";
import { RegistrySsdForm } from "../../../form/registry/ssd/RegistrySsdForm";

export function FormContainer() {
  const navigate = useNavigate();

  return (
    <TdModal
      onClose={() => navigate(-1)}
      ariaLabel="Fermer"
      closeLabel="Fermer"
      isOpen
      size="TD_SIZE"
      hasFooter={true}
    >
      <RegistrySsdForm onClose={() => navigate(-1)} />
    </TdModal>
  );
}
