import React from "react";
import { Bsff, BsffStatus } from "generated/graphql/types";
import SignEmissionModal from "../Bsff/SignEmission/SignEmissionModal";
import SignTransportModal from "../Bsff/SignTransport/SignTransportModal";
import SignReceptionModal from "../Bsff/SignReception/SignReceptionModal";
import { SignBsffAcceptationOnePackaging } from "dashboard/components/BSDList/BSFF/WorkflowAction/SignAcceptation";
import { SignPackagings } from "dashboard/components/BSDList/BSFF/WorkflowAction/SignPackagings";
import { SignBsffOperationOnePackaging } from "dashboard/components/BSDList/BSFF/WorkflowAction/SignOperation";

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
    return (
      <SignEmissionModal bsffId={bsd.id} isOpen={isOpen} onClose={onClose} />
    );
  };

  const renderSignedByEmitterModal = () => {
    return (
      <SignTransportModal bsffId={bsd.id} isOpen={isOpen} onClose={onClose} />
    );
  };

  const renderSentModal = () => {
    return (
      <SignReceptionModal bsffId={bsd.id} isOpen={isOpen} onClose={onClose} />
    );
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
    if (bsd.packagings?.length === 1) {
      return (
        <SignBsffOperationOnePackaging
          bsffId={bsd.id}
          {...actionButtonAdapterProps}
        />
      );
    }
    return <SignPackagings bsffId={bsd.id} {...actionButtonAdapterProps} />;
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
