import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ControlledTabs } from "./FormSteps";
import TdModal from "../../Apps/common/Components/Modal/Modal";

export default function FormContainer() {
  const { id } = useParams<{
    id?: string;
    siret: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <TdModal
      onClose={() => navigate(-1)}
      ariaLabel="Annuler la modification"
      closeLabel="Annuler"
      isOpen
      size="TD_SIZE"
    >
      <ControlledTabs bsdId={id} publishErrors={location.state.publishErrors} />
    </TdModal>
  );
}
