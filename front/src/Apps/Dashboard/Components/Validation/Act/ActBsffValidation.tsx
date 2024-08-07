import React from "react";
import { Bsff, BsffStatus } from "@td/codegen-ui";
import { SignEmission } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignEmission";
import { SignTransport } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignTransport";
import { SignReception } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignReception";
import { SignBsffAcceptationOnePackaging } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignAcceptation";
import { SignPackagings } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignPackagings";
import { SignBsffOperationOnePackaging } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignOperation";

interface ActBsffValidationProps {
  bsd: Bsff;
  currentSiret: string;
  isOpen: boolean;
  onClose: () => void;
}
const ActBsffValidation = ({
  bsd,
  currentSiret,
  isOpen,
  onClose
}: ActBsffValidationProps) => {
  const actionButtonAdapterProps = {
    isModalOpenFromParent: isOpen,
    onModalCloseFromParent: onClose,
    displayActionButton: false
  };

  const renderInitialModal = () => {
    return <SignEmission bsffId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderSignedByEmitterModal = () => {
    return <SignTransport bsffId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const renderSentModal = () => {
    const nextTransporter = (bsd.transporters ?? []).find(
      t => !t.transport?.signature?.date
    );

    if (nextTransporter && nextTransporter.company?.orgId === currentSiret) {
      return <SignTransport bsffId={bsd.id} {...actionButtonAdapterProps} />;
    }

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
