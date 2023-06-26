import React from "react";
import { Bsff, BsffStatus } from "generated/graphql/types";
import { SignEmission } from "dashboard/components/BSDList/BSFF/WorkflowAction/SignEmission";
import { SignTransport } from "dashboard/components/BSDList/BSFF/WorkflowAction/SignTransport";
import { SignReception } from "dashboard/components/BSDList/BSFF/WorkflowAction/SignReception";
import { SignBsffAcceptationOnePackaging } from "dashboard/components/BSDList/BSFF/WorkflowAction/SignAcceptation";
import { SignPackagings } from "dashboard/components/BSDList/BSFF/WorkflowAction/SignPackagings";

interface ActBsffValidationProps {
  bsd: Bsff;
  isOpen: boolean;
  onClose: () => void;
}
const ActBsffValidation = ({
  bsd,
  isOpen,
  onClose,
}: ActBsffValidationProps) => {
  const actionButtonAdapterProps = {
    isModalOpenFromParent: isOpen,
    onModalCloseFromParent: onClose,
    displayActionButton: false,
  };

  const renderInitialModal = () => {
    return <SignEmission bsffId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderSignedByEmitterModal = () => {
    return <SignTransport bsffId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderSentModal = () => {
    return <SignReception bsffId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderReceivedModal = () => {
    if (bsd.packagings?.length === 1) {
      return (
        <SignBsffAcceptationOnePackaging
          bsffId={bsd.id}
          {...actionButtonAdapterProps}
        />
      );
    }
    return <SignPackagings bsffId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderAcceptedModal = () => {
    return renderReceivedModal();
  };
  const renderPartiallyRefusedModal = () => {
    return <SignPackagings bsffId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const status = bsd["bsffStatus"];
  return (
    <>
      {status === BsffStatus.Initial && renderInitialModal()}
      {status === BsffStatus.SignedByEmitter && renderSignedByEmitterModal()}
      {status === BsffStatus.Sent && renderSentModal()}
      {status === BsffStatus.Received && renderReceivedModal()}
      {status === BsffStatus.Accepted && renderAcceptedModal()}
      {status === BsffStatus.PartiallyRefused && renderPartiallyRefusedModal()}
    </>
  );
};

export default ActBsffValidation;
