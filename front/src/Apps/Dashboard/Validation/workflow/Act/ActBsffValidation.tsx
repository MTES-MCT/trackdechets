import React from "react";
import { Bsff, BsffStatus } from "@td/codegen-ui";
import { SignPackagings } from "../../bsff/SignPackagings";
import SignBsffPackagingModal from "../../bsff/SignBsffPackagingModal";
import SignBsffEmission from "../../bsff/SignBsffEmission";
import SignBsffTransport from "../../bsff/SignBsffTransport";
import { SignBsffReception } from "../../bsff/SignBsffReception";

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
    return <SignBsffEmission bsffId={bsd.id} onClose={onClose} />;
  };

  const renderSignedByEmitterModal = () => {
    return <SignBsffTransport bsffId={bsd.id} onClose={onClose} />;
  };

  const renderSentModal = () => {
    const nextTransporter = (bsd.transporters ?? []).find(
      t => !t.transport?.signature?.date
    );

    if (nextTransporter && nextTransporter.company?.orgId === currentSiret) {
      return <SignBsffTransport bsffId={bsd.id} onClose={onClose} />;
    }

    return <SignBsffReception bsffId={bsd.id} onClose={onClose} />;
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
