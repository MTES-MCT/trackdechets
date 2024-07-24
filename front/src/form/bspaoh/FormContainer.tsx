import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ControlledTabs } from "./FormSteps";
import TdModal from "../../Apps/common/Components/Modal/Modal";

export default function FormContainer() {
  const { id } = useParams<{ id?: string; siret: string }>();
  const navigate = useNavigate();

  return (
    <TdModal
      onClose={() => navigate(-1)}
      ariaLabel="Annuler la modification"
      closeLabel="Annuler"
      isOpen
      size="TD_SIZE"
    >
      <ControlledTabs bsdId={id} />
    </TdModal>
  );
}
