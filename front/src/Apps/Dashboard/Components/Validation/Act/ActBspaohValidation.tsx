import React from "react";
import { Bspaoh, BspaohStatus } from "@td/codegen-ui";
import { SignEmission } from "../../../../../dashboard/components/BSDList/BSPaoh/WorkflowAction/SignEmission";
import { SignTransport } from "../../../../../dashboard/components/BSDList/BSPaoh/WorkflowAction/SignTransport";
import { SignReception } from "../../../../../dashboard/components/BSDList/BSPaoh/WorkflowAction/SignReception";
import { SignOperation } from "../../../../../dashboard/components/BSDList/BSPaoh/WorkflowAction/SignOperation";

interface ActBspaohValidationProps {
  bsd: Bspaoh;
  currentSiret: string;
  isOpen: boolean;
  onClose: () => void;
}
const ActBspaohValidation = ({
  bsd,
  currentSiret,
  isOpen,
  onClose
}: ActBspaohValidationProps) => {
  const actionButtonAdapterProps = {
    isModalOpenFromParent: isOpen,
    onModalCloseFromParent: onClose,
    displayActionButton: false
  };

  const renderInitialModal = () => {
    return (
      <SignEmission
        bspaohId={bsd.id}
        siret={currentSiret}
        {...actionButtonAdapterProps}
      />
    );
  };

  const renderSignedByProducerModal = () => {
    return (
      <SignTransport
        bspaohId={bsd.id}
        siret={currentSiret}
        {...actionButtonAdapterProps}
      />
    );
  };

  const renderSentModal = () => {
    return (
      <SignReception
        bspaohId={bsd.id}
        siret={currentSiret}
        {...actionButtonAdapterProps}
      />
    );
  };

  const renderReceivedModal = () => {
    return (
      <SignOperation
        bspaohId={bsd.id}
        siret={currentSiret}
        {...actionButtonAdapterProps}
      />
    );
  };

  const status = bsd["bspaohStatus"];

  return (
    <>
      {status === BspaohStatus.Initial && renderInitialModal()}
      {status === BspaohStatus.SignedByProducer &&
        renderSignedByProducerModal()}
      {status === BspaohStatus.Sent && renderSentModal()}
      {status === BspaohStatus.Received && renderReceivedModal()}
    </>
  );
};

export default ActBspaohValidation;
