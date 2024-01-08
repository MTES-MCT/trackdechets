import * as React from "react";
import { FormStatus } from "@td/codegen-ui";
import { ActionButton, Modal } from "../../../../../common/components";
import { IconShipmentSignSmartphone } from "../../../../../Apps/common/Components/Icons/Icons";
import { WorkflowActionProps } from "./WorkflowAction";
import SignEmissionFormModalContent from "./SignEmissionFormModalContent";

export default function SignEmissionForm({ siret, form }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  let emitterSirets = [form.emitter?.company?.siret, form.ecoOrganisme?.siret];
  let emitterLabel = "émetteur";

  if (form.status === FormStatus.Resealed) {
    emitterSirets = [form.recipient?.company?.siret];
    emitterLabel = "entreposage provisoire";
  }

  const currentUserIsEmitter = emitterSirets.includes(siret);
  const title = currentUserIsEmitter
    ? `Signer en tant qu'${emitterLabel}`
    : `Faire signer l'${emitterLabel}`;

  const onClose = () => setIsOpen(false);

  return (
    <>
      <ActionButton
        icon={<IconShipmentSignSmartphone size="24px" />}
        onClick={() => setIsOpen(true)}
      >
        {title}
      </ActionButton>
      {isOpen && (
        <Modal onClose={onClose} ariaLabel={title} isOpen>
          <h2 className="td-modal-title">{title}</h2>
          <SignEmissionFormModalContent
            title={title}
            siret={siret}
            formId={form.id}
            onClose={onClose}
          />
        </Modal>
      )}
    </>
  );
}
