import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DsfrModal } from "../../Apps/common/Components/Modal/DsfrModal";
import { ControlledTabs } from "./FormSteps";

export default function FormContainer() {
  const { id } = useParams<{
    id?: string;
    siret: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <DsfrModal
      onClose={() => navigate(-1)}
      closeLabel="Annuler"
      size="BSD_FORM"
    >
      <ControlledTabs bsdId={id} publishErrors={location.state.publishErrors} />
    </DsfrModal>
  );
}
