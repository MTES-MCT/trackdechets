import { ActionButton, Modal } from "../../../../../common/components";
import { IconCheckCircle1 } from "../../../../../Apps/common/Components/Icons/Icons";
import { Bsff, BsffPackaging, WasteAcceptationStatus } from "codegen-ui";
import React from "react";
import { SignBsffAcceptationOnePackagingModalContent } from "./SignAcceptation";
import { SignBsffOperationOnePackagingModalContent } from "./SignOperation";

interface WorkflowPackagingActionProps {
  bsff: Bsff;
  packaging: BsffPackaging;
}

export function PackagingAction({
  bsff,
  packaging
}: WorkflowPackagingActionProps) {
  if (packaging.operation?.signature?.date) {
    return null;
  }
  if (packaging.acceptation?.signature?.date) {
    if (packaging.acceptation?.status === WasteAcceptationStatus.Refused) {
      return null;
    }
    return <SignBsffPackagingOperation packaging={packaging} bsff={bsff} />;
  }
  return <SignBsffPackagingAcceptation packaging={packaging} bsff={bsff} />;
}

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
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer l'acceptation
      </ActionButton>

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
      <ActionButton
        icon={<IconCheckCircle1 size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        Signer l'opération
      </ActionButton>

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
