import React from "react";
import { SignBsffPackagingsModal } from "./SignBsffPackagingsModal";
import Button from "@codegouvfr/react-dsfr/Button";

interface SignPackagingsProps {
  bsffId: string;
  isModalOpenFromParent?: boolean;
  onModalCloseFromParent?: () => void;
  displayActionButton?: boolean;
}

/**
 * Bouton d'action permettant de signer les acceptations
 * et opérations sur les contenants d'un BSFF
 */
export function SignPackagings({
  bsffId,
  isModalOpenFromParent,
  onModalCloseFromParent,
  displayActionButton = true
}: SignPackagingsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {displayActionButton && (
        <>
          <Button size="small" onClick={() => setIsOpen(true)}>
            Gérer les contenants
          </Button>
          {isOpen && (
            <SignBsffPackagingsModal
              bsffId={bsffId}
              onClose={() => setIsOpen(false)}
            />
          )}
        </>
      )}

      {isModalOpenFromParent && (
        <SignBsffPackagingsModal
          bsffId={bsffId}
          onClose={onModalCloseFromParent!}
        />
      )}
    </>
  );
}
