import Button, { ButtonProps } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { useState } from "react";
import SignBsffPackagingModal from "./SignBsffPackagingModal";

type UpdateBsffPackagingButtonProps = {
  packagingId: string;
  btnLabel: string;
  btnPriority?: ButtonProps.Common["priority"];
} & ButtonProps.Common;

/**
 * Bouton permettant de contrôler l'affichage de la modale
 * d'acceptation / traitement / correction
 */
function SignBsffPackagingButton({
  packagingId,
  btnLabel,
  btnPriority = "primary"
}: UpdateBsffPackagingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        size="small"
        priority={btnPriority}
        onClick={() => setIsOpen(true)}
      >
        {btnLabel}
      </Button>
      {isOpen && (
        <SignBsffPackagingModal
          packagingId={packagingId}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default SignBsffPackagingButton;
