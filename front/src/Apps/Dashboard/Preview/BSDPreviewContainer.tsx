import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import TdModal from "../../common/Components/Modal/Modal";
import { BsdTypename } from "../../common/types/bsdTypes";
import BSVHUPreviewContent from "./BSVHU/BSVHUPreviewContent";

interface BSDPreviewContainerProps {
  bsdTypeName: BsdTypename;
}
const BSDPreviewContainer = ({ bsdTypeName }: BSDPreviewContainerProps) => {
  const { id } = useParams<{ id?: string; siret: string }>();
  const navigate = useNavigate();
  const formContent = {
    [BsdTypename.Bsvhu]: <BSVHUPreviewContent bsdId={id!} />
  };

  return (
    <TdModal
      onClose={() => navigate(-1)}
      ariaLabel="Annuler la modification"
      closeLabel="Annuler"
      isOpen
      size="XL"
    >
      {formContent[bsdTypeName]}
    </TdModal>
  );
};

export default BSDPreviewContainer;
