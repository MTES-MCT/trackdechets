import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ControlledTabs } from "./bspaoh/FormSteps";
import TdModal from "../../common/Components/Modal/Modal";
import { BsdTypename } from "../../common/types/bsdTypes";

interface FormContainerProps {
  bsdTypeName: BsdTypename;
}
const FormContainer = ({ bsdTypeName }: FormContainerProps) => {
  const { id } = useParams<{ id?: string; siret: string }>();
  const navigate = useNavigate();

  const formContent = {
    [BsdTypename.Bspaoh]: <ControlledTabs bsdId={id} />
  };

  return (
    <TdModal
      onClose={() => navigate(-1)}
      ariaLabel="Annuler la modification"
      closeLabel="Annuler"
      isOpen
      size="TD_SIZE"
    >
      {formContent[bsdTypeName]}
    </TdModal>
  );
};

export default FormContainer;
