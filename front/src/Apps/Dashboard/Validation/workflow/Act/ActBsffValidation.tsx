import React from "react";
import { Bsff, BsffStatus } from "@td/codegen-ui";
import { SignEmission } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignEmission";
import { SignTransport } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignTransport";
import { SignReception } from "../../../../../dashboard/components/BSDList/BSFF/WorkflowAction/SignReception";
import { SignPackagings } from "../../../Signature/bsff/SignPackagings";
import SignBsffPackagingModal from "../../../Signature/bsff/SignBsffPackagingModal";

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
        <SignBsffPackagingModal
          packagingId={bsd.packagings[0].id}
          onClose={onClose}
        />
      );
    }
    return <SignPackagings bsffId={bsd.id} {...actionButtonAdapterProps} />;
  };

  const status =
    bsd["bsffStatus"] ??
    // Lors du clic sur un bouton primaire, `bsd` correspond à
    // un node de la query `bsds` qui fait un mapping status -> bsffStatus
    // alors que lors du clic sur le bouton secondaire `Corriger`, bsd
    // correspond à `BsdDisplay`. Il faudrait revoir un peu le typing.
    bsd.status;

  return (
    <>
      {status === BsffStatus.Initial && renderInitialModal()}
      {status === BsffStatus.SignedByEmitter && renderSignedByEmitterModal()}
      {status === BsffStatus.Sent && renderSentModal()}
      {[
        BsffStatus.Received,
        BsffStatus.Accepted,
        BsffStatus.Refused,
        BsffStatus.PartiallyRefused,
        BsffStatus.Processed,
        BsffStatus.IntermediatelyProcessed
      ].includes(status) &&
        // La modale de signature et de correction par contenant est la même
        // à partir de la réception du BSFF. L'affichage des différents
        // champs du formulaire en fonction du statut est géré directement
        // au sein des modales <SignBsffPackagingModal /> (1 seul contenant) ou
        // <SignPackagings /> (plusieurs contenants).
        renderReceivedModal()}
    </>
  );
};

export default ActBsffValidation;
