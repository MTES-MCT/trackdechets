import React from "react";
import { Bsvhu, BsvhuStatus } from "@td/codegen-ui";
import SignVhuEmission from "../../Bsvhu/SignVhuEmission";
import SignVhuTransport from "../../Bsvhu/SignVhuTransport";
import SignVhuOperation from "../../Bsvhu/SignVhuOperation";
import SignVhuReception from "../../Bsvhu/SignVhuReception";

interface ActBsvhuValidationProps {
  bsd: Bsvhu;
  currentSiret: string;
  isOpen: boolean;
  onClose: () => void;
}
const ActBsvhuValidation = ({
  bsd,
  currentSiret,
  onClose
}: ActBsvhuValidationProps) => {
  const renderInitialModal = () => {
    return <SignVhuEmission bsvhuId={bsd.id} onClose={onClose} />;
  };

  const renderSignedByProducerModal = () => {
    return <SignVhuTransport bsvhuId={bsd.id} onClose={onClose} />;
  };

  const renderReceivedModal = () => {
    return <SignVhuOperation bsvhuId={bsd.id} onClose={onClose} />;
  };

  const renderSentModal = () => {
    return <SignVhuReception bsvhuId={bsd.id} onClose={onClose} />;
  };

  const status = bsd["bsvhuStatus"];
  const canIrregularSituationSignWithNoSiret =
    status === BsvhuStatus.Initial &&
    bsd.emitter?.irregularSituation &&
    bsd.emitter?.noSiret;

  const canIrregularSituationSignWithSiretRegistered =
    status === BsvhuStatus.Initial &&
    bsd.emitter?.irregularSituation &&
    !bsd.emitter?.noSiret &&
    bsd.emitter?.company?.siret === currentSiret;

  const canIrregularSituationSignWithSiretNotRegistered =
    status === BsvhuStatus.Initial &&
    bsd.emitter?.irregularSituation &&
    !bsd.emitter?.noSiret &&
    bsd.emitter?.company?.siret !== currentSiret &&
    bsd.transporter?.company?.siret === currentSiret;

  const canRegularSituationSign =
    status === BsvhuStatus.Initial && !bsd.emitter?.irregularSituation;

  return (
    <>
      {status === BsvhuStatus.Initial &&
        canRegularSituationSign &&
        renderInitialModal()}
      {status === BsvhuStatus.Initial &&
        canIrregularSituationSignWithSiretRegistered &&
        renderInitialModal()}
      {(status === BsvhuStatus.SignedByProducer ||
        (status === BsvhuStatus.Initial &&
          (canIrregularSituationSignWithNoSiret ||
            canIrregularSituationSignWithSiretNotRegistered))) &&
        renderSignedByProducerModal()}
      {status === BsvhuStatus.Sent && renderSentModal()}
      {status === BsvhuStatus.Received && renderReceivedModal()}
    </>
  );
};

export default ActBsvhuValidation;
