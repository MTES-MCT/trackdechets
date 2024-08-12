import React from "react";
import { Bspaoh, BspaohStatus } from "@td/codegen-ui";
import { SignEmission } from "../../BSPaoh/WorkflowAction/SignEmission";
import { SignTransport } from "../../BSPaoh/WorkflowAction/SignTransport";
import { SignDelivery } from "../../BSPaoh/WorkflowAction/SignDelivery";
import { SignReception } from "../../BSPaoh/WorkflowAction/SignReception";
import { SignOperation } from "../../BSPaoh/WorkflowAction/SignOperation";

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
    return <SignEmission bspaohId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderSignedByProducerModal = () => {
    return <SignTransport bspaohId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderSentModal = () => {
    if (
      currentSiret === bsd?.transporter?.company?.siret &&
      !bsd?.destination?.handedOverToDestination?.signature
    ) {
      return <SignDelivery bspaohId={bsd.id} {...actionButtonAdapterProps} />;
    }

    return <SignReception bspaohId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderReceivedModal = () => {
    return <SignOperation bspaohId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const status = bsd["bspaohStatus"];

  return (
    <>
      {status === BspaohStatus.Initial && renderInitialModal()}
      {status === BspaohStatus.SignedByProducer &&
        renderSignedByProducerModal()}
      {status === BspaohStatus.Sent && renderSentModal()}
      {status === BspaohStatus.Received && renderReceivedModal()}
      {status === BspaohStatus.PartiallyRefused && renderReceivedModal()}
    </>
  );
};

export default ActBspaohValidation;
