import React from "react";
import SignBsdaTransport from "../../Bsda/SignBsdaTransport";
import SignBsdaWork from "../../Bsda/SignBsdaWork";
import { Bsda, BsdaStatus } from "@td/codegen-ui";
import { isCollection_2710 } from "../../../dashboardServices";
import SignBsdaEmission from "../../Bsda/SignBsdaEmission";
import SignBsdaReception from "../../Bsda/SignBsdaReception";
import SignBsdaOperation from "../../Bsda/SignBsdaOperation";

interface ActBsdaValidationProps {
  bsd: Bsda;
  currentSiret: string;
  onClose: () => void;
}
const ActBsdaValidation = ({
  bsd,
  currentSiret,
  onClose
}: ActBsdaValidationProps) => {
  const renderInitialModal = () => {
    if (
      isCollection_2710(bsd["bsdaType"]) &&
      currentSiret === bsd.destination?.company?.siret
    ) {
      return <SignBsdaReception bsdaId={bsd.id} onClose={onClose} />;
    }

    if (
      bsd.emitter?.isPrivateIndividual &&
      bsd.worker?.isDisabled &&
      currentSiret === bsd.transporter?.company?.orgId
    ) {
      return <SignBsdaTransport bsdaId={bsd.id} onClose={onClose} />;
    }

    if (
      bsd.emitter?.isPrivateIndividual &&
      currentSiret === bsd.worker?.company?.siret
    ) {
      return <SignBsdaWork bsdaId={bsd.id} onClose={onClose} />;
    }

    if (currentSiret === bsd.emitter?.company?.siret) {
      return <SignBsdaEmission bsdaId={bsd.id} onClose={onClose} />;
    }
  };

  const renderSignedByProducerModal = () => {
    if (
      bsd["bsdaType"] === "GATHERING" ||
      bsd["bsdaType"] === "RESHIPMENT" ||
      bsd.worker?.isDisabled
    ) {
      return <SignBsdaTransport bsdaId={bsd.id} onClose={onClose} />;
    }
    return <SignBsdaWork bsdaId={bsd.id} onClose={onClose} />;
  };
  const renderSignedByWorkerModal = () => {
    return <SignBsdaTransport bsdaId={bsd.id} onClose={onClose} />;
  };
  const renderSentModal = () => {
    const nextTransporter = (bsd.transporters ?? []).find(
      t => !t.transport?.signature?.date
    );

    if (nextTransporter && nextTransporter.company?.orgId === currentSiret) {
      return <SignBsdaTransport bsdaId={bsd.id} onClose={onClose} />;
    }

    return <SignBsdaReception bsdaId={bsd.id} onClose={onClose} />;
  };

  const renderReceivedModal = () => {
    return <SignBsdaOperation bsdaId={bsd.id} onClose={onClose} />;
  };

  const status = bsd["bsdaStatus"];
  return (
    <>
      {status === BsdaStatus.Initial && renderInitialModal()}
      {status === BsdaStatus.SignedByProducer && renderSignedByProducerModal()}
      {status === BsdaStatus.SignedByWorker && renderSignedByWorkerModal()}
      {status === BsdaStatus.Sent && renderSentModal()}
      {status === BsdaStatus.Received && renderReceivedModal()}
    </>
  );
};

export default React.memo(ActBsdaValidation);
