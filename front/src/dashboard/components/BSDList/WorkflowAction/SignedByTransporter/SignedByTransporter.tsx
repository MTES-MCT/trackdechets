import * as React from "react";
import { IconShipmentSignSmartphone } from "common/components/Icons";
import { WorkflowActionProps } from "../WorkflowAction";
import { SignedByTransporterModal } from "./SignedByTransporterModal";
import { ActionButton } from "common/components";

export function SignedByTransporter({ form }: WorkflowActionProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ActionButton
        title="Signer l'enlèvement"
        icon={IconShipmentSignSmartphone}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && (
        <SignedByTransporterModal
          form={form}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
