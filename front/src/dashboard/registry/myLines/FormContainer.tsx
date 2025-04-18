import { RegistryImportType } from "@td/codegen-ui";
import React from "react";
import TdModal from "../../../Apps/common/Components/Modal/Modal";
import { RegistrySsdForm } from "../../../form/registry/ssd/RegistrySsdForm";
import { RegistryIncomingTexsForm } from "../../../form/registry/incomingTexs/RegistryIncomingTexsForm";

export function FormContainer({
  onClose,
  type
}: {
  onClose: () => void;
  type: RegistryImportType;
}) {
  const Form = getFormComponent(type);

  return (
    <TdModal
      onClose={onClose}
      ariaLabel="Fermer"
      closeLabel="Fermer"
      isOpen
      size="TD_SIZE"
      hasFooter={true}
    >
      <Form onClose={onClose} />
    </TdModal>
  );
}

function getFormComponent(type: RegistryImportType) {
  switch (type) {
    case RegistryImportType.Ssd:
      return RegistrySsdForm;
    case RegistryImportType.IncomingTexs:
      return RegistryIncomingTexsForm;
    default:
      throw new Error("Unknown form type");
  }
}
