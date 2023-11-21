import * as React from "react";
import { ActionButton, Modal } from "../../../../../common/components";
import { IconShipmentSignSmartphone } from "../../../../../Apps/common/Components/Icons/Icons";
import { WorkflowActionProps } from "./WorkflowAction";
import SignTransportFormModalContent from "./SignTransportFormModalContent";

export default function SignTransportForm({
  siret,
  form
}: WorkflowActionProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const title = "Signature transporteur";
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
          <SignTransportFormModalContent
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
