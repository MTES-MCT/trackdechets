import React from "react";
import { useNavigate } from "react-router-dom";
import TdModal from "../../../Apps/common/Components/Modal/Modal";
import { RegistrySsdForm } from "../../../form/registry/ssd/RegistrySsdForm";

export function FormContainer() {
  const navigate = useNavigate();

  return (
    <TdModal
      onClose={() => navigate(-1)}
      ariaLabel="Annuler"
      closeLabel="Annuler"
      isOpen
      size="TD_SIZE"
    >
      <RegistrySsdForm onClose={() => navigate(-1)} />
    </TdModal>
  );
}
