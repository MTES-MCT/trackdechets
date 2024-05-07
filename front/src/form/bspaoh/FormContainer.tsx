import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DsfrModal } from "../../Apps/common/Components/Modal/DsfrModal";
import { ControlledTabs } from "./FormSteps";

export default function FormContainer() {
  const { id } = useParams<{ id?: string; siret: string }>();
  const navigate = useNavigate();

  return (
    <DsfrModal
      onClose={() => navigate(-1)}
      closeLabel="Annuler"
      size="L"
      padding={false}
    >
      <ControlledTabs bsdId={id} />
    </DsfrModal>
  );
}
