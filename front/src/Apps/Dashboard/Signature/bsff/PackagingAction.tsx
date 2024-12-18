import { Modal } from "../../../../common/components";
import { Bsff, BsffPackaging } from "@td/codegen-ui";
import React from "react";
import { SignBsffAcceptationOnePackagingModalContent } from "./SignAcceptation";
import { SignBsffOperationOnePackagingModalContent } from "./SignOperation";
import Button from "@codegouvfr/react-dsfr/Button";

interface SignBsffPackagingProps {
  bsff: Bsff;
  packaging: BsffPackaging;
}

export function SignBsffPackagingAcceptation({
  bsff,
  packaging
}: SignBsffPackagingProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button size="small" onClick={() => setIsOpen(true)}>
        Accepter
      </Button>

      {isOpen && (
        <Modal
          onClose={() => setIsOpen(false)}
          ariaLabel="Signer l'acceptation"
          isOpen
        >
          <h2 className="td-modal-title">
            Signer l'acceptation du contenant {packaging.numero}
          </h2>
          <SignBsffAcceptationOnePackagingModalContent
            bsff={bsff}
            packaging={packaging}
            onCancel={() => setIsOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}

export function SignBsffPackagingOperation({
  bsff,
  packaging
}: SignBsffPackagingProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button size="small" onClick={() => setIsOpen(true)}>
        Valider le traitement
      </Button>

      {isOpen && (
        <Modal
          onClose={() => setIsOpen(false)}
          ariaLabel="Signer l'opération"
          isOpen
        >
          <h2 className="td-modal-title">
            Signer l'opération du contenant {packaging.numero}
          </h2>
          <SignBsffOperationOnePackagingModalContent
            bsff={bsff}
            packaging={packaging}
            onCancel={() => setIsOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
