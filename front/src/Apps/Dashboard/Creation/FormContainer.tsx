import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ControlledTabs } from "./bspaoh/FormSteps";
import TdModal from "../../common/Components/Modal/Modal";
import { BsdTypename } from "../../common/types/bsdTypes";
import BsvhuFormSteps from "./bsvhu/BsvhuFormSteps";
import BsdaFormSteps from "./bsda/FormSteps";

interface FormContainerProps {
  bsdTypeName: BsdTypename;
}
const FormContainer = ({ bsdTypeName }: FormContainerProps) => {
  const { id } = useParams<{ id?: string; siret: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const publishErrors = location.state.publishErrors;
  const formContent = {
    [BsdTypename.Bspaoh]: (
      <ControlledTabs bsdId={id} publishErrorsFromRedirect={publishErrors} />
    ),
    [BsdTypename.Bsvhu]: (
      <BsvhuFormSteps bsdId={id} publishErrorsFromRedirect={publishErrors} />
    ),
    [BsdTypename.Bsda]: (
      <BsdaFormSteps bsdId={id} publishErrorsFromRedirect={publishErrors} />
    )
  };
  return (
    <TdModal
      onClose={() => navigate(-1)}
      ariaLabel="Annuler la modification"
      closeLabel="Annuler"
      isOpen
      size="TD_SIZE"
      hasFooter={true}
    >
      {formContent[bsdTypeName]}
    </TdModal>
  );
};

export default FormContainer;
