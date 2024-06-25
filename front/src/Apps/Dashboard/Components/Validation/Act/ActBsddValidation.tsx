import React, { useEffect } from "react";
import { useLazyQuery, useQuery } from "@apollo/client";
import TdModal from "../../../../common/Components/Modal/Modal";
import { GET_FORM } from "../../../../../form/bsdd/utils/queries";
import {
  CompanyType,
  EmitterType,
  Form,
  FormStatus,
  Query,
  QueryCompanyPrivateInfosArgs,
  QueryFormArgs
} from "@td/codegen-ui";
import {
  isAppendix1,
  isSignTransportCanSkipEmission
} from "../../../dashboardServices";
import { Appendix1ProducerForm } from "../../../../../form/bsdd/appendix1Producer/form";
import MarkAsProcessedModalContent from "../../../../../dashboard/components/BSDList/BSDD/WorkflowAction/MarkAsProcessedModalContent";
import SignEmissionFormModalContent from "../../../../../dashboard/components/BSDList/BSDD/WorkflowAction/SignEmissionFormModalContent";
import SignTransportFormModalContent from "../../../../../dashboard/components/BSDList/BSDD/WorkflowAction/SignTransportFormModalContent";
import { SignReception } from "../../../../../dashboard/components/BSDList/BSDD/WorkflowAction/SignReception";
import { mapBsdd } from "../../../bsdMapper";
import { COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS } from "../../../../common/queries/company/query";

interface ActBsddValidationProps {
  bsd: Form;
  currentSiret: string;
  isOpen: boolean;
  onClose: () => void;
  hasAutomaticSignature?: boolean;
  hasEmitterSignSecondaryCta?: boolean;
}
const ActBsddValidation = ({
  bsd,
  currentSiret,
  isOpen,
  onClose,
  hasAutomaticSignature,
  hasEmitterSignSecondaryCta
}: ActBsddValidationProps) => {
  const [getBsdd, { data }] = useLazyQuery<Pick<Query, "form">, QueryFormArgs>(
    GET_FORM,
    {
      variables: {
        id: bsd.id,
        readableId: null
      },
      fetchPolicy: "network-only"
    }
  );

  const { data: emitterCompanyData } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_RECEIVED_SIGNATURE_AUTOMATIONS, {
    variables: { clue: bsd.emitter?.company?.siret! },
    skip:
      !data ||
      data.form.emitter?.type !== EmitterType.Appendix1Producer ||
      data.form.transporter?.company?.siret !== currentSiret
  });
  const emitterIsExutoireOrTtr = Boolean(
    emitterCompanyData?.companyPrivateInfos.companyTypes.filter(type =>
      [CompanyType.Wasteprocessor, CompanyType.Collector].includes(type)
    )?.length
  );

  useEffect(() => {
    if (
      bsd.status === FormStatus.Sealed ||
      bsd.status === FormStatus.Sent ||
      bsd.status === FormStatus.Resent ||
      bsd.status === FormStatus.TempStored ||
      bsd.status === FormStatus.TempStorerAccepted ||
      bsd.status === FormStatus.Received ||
      bsd.status === FormStatus.Accepted
    ) {
      getBsdd();
    }
  }, [bsd.status, getBsdd]);

  const renderTitle = (): string => {
    if (bsd.status === FormStatus.Resealed) {
      const emitterSirets = [bsd.recipient?.company?.siret];
      const currentUserIsEmitter = emitterSirets.includes(currentSiret);

      const title = currentUserIsEmitter
        ? "Signer en tant qu'entreposage provisoire"
        : "Faire signer l'entreposage provisoire";

      return title;
    }

    if (bsd.status === FormStatus.Resent) {
      return "Signer la réception";
    }

    if (bsd.status === FormStatus.Sealed) {
      const bsdDisplay = mapBsdd(bsd);
      const emitterSirets = [
        bsd.emitter?.company?.siret,
        bsd.ecoOrganisme?.siret
      ];
      const currentUserIsEmitter = emitterSirets.includes(currentSiret);
      const title = currentUserIsEmitter
        ? "Signer en tant qu'émetteur"
        : "Faire signer l'émetteur";
      if (hasEmitterSignSecondaryCta) {
        return "Faire signer l'émetteur";
      }

      if (
        isSignTransportCanSkipEmission(
          currentSiret,
          bsdDisplay,
          hasAutomaticSignature,
          emitterIsExutoireOrTtr
        )
      ) {
        return "Signature transporteur";
      }
      if (bsd.emitter?.type === EmitterType.Appendix1Producer) {
        return title;
      }

      return title;
    }

    if (
      bsd.status === FormStatus.SignedByProducer ||
      bsd.status === FormStatus.SignedByTempStorer
    ) {
      return "Signature transporteur";
    }

    if (bsd.status === FormStatus.Sent) {
      const nextTransporter = (bsd.transporters ?? []).find(
        t => !t.takenOverAt
      );
      if (nextTransporter && nextTransporter.company?.orgId === currentSiret) {
        return "Signature transporteur";
      }
      const isTempStorage = bsd.recipient?.isTempStorage;
      if (isTempStorage) {
        return "Signer l'entreposage provisoire";
      } else {
        return "Signer la réception";
      }
    }

    if (bsd.status === FormStatus.TempStored) {
      return "Signer l'acceptation de l'entreposage provisoire";
    }

    if (
      bsd.status === FormStatus.TempStorerAccepted ||
      bsd.status === FormStatus.Accepted
    ) {
      return "Valider le traitement";
    }

    if (bsd.status === FormStatus.Received) {
      return "Signer l'acceptation";
    }

    return "";
  };

  const renderSignTransportFormModal = () => (
    <TdModal isOpen={isOpen} onClose={onClose} ariaLabel={renderTitle()}>
      <h2 className="td-modal-title">{renderTitle()}</h2>
      <SignTransportFormModalContent
        title={renderTitle()}
        siret={currentSiret}
        formId={bsd.id}
        onClose={onClose}
      />
    </TdModal>
  );

  const renderSignEmissionFormModal = () => {
    return (
      <TdModal isOpen={isOpen} onClose={onClose} ariaLabel={renderTitle()}>
        <h2 className="td-modal-title">{renderTitle()}</h2>
        <SignEmissionFormModalContent
          title={renderTitle()}
          siret={currentSiret}
          formId={bsd.id}
          onClose={onClose}
        />
      </TdModal>
    );
  };

  const renderMarkAsProcessedModal = () => {
    return (
      <TdModal isOpen={isOpen} onClose={onClose} ariaLabel={renderTitle()}>
        <h2 className="td-modal-title">{renderTitle()}</h2>
        <MarkAsProcessedModalContent data={data} onClose={onClose} />
      </TdModal>
    );
  };

  const renderMarkAsReceivedModal = () => {
    return (
      <SignReception
        title={renderTitle()}
        formId={bsd.id}
        onModalCloseFromParent={onClose}
        isModalOpenFromParent={isOpen}
        displayActionButton={false}
      />
    );
  };

  const renderContentSealed = () => {
    const bsdDisplay = mapBsdd(bsd);
    if (isAppendix1(bsdDisplay)) {
      return renderAddAppendix1Modal();
    }

    if (hasEmitterSignSecondaryCta) {
      return renderSignEmissionFormModal();
    }
    if (
      isSignTransportCanSkipEmission(
        currentSiret,
        bsdDisplay,
        hasAutomaticSignature,
        emitterIsExutoireOrTtr
      )
    ) {
      return renderSignTransportFormModal();
    } else {
      return renderSignEmissionFormModal();
    }
  };

  const renderContentResealed = () => {
    return renderSignEmissionFormModal();
  };

  const renderContentSignedByProducer = () => {
    if (bsd.transporter?.company?.orgId === currentSiret) {
      return renderSignTransportFormModal();
    }
  };

  const renderContentSent = () => {
    // const isTempStorage = bsd.recipient?.isTempStorage;

    // Renvoie la modale de signature transporteur en cas de transport
    // multi-modal si l'établissement courant est le prochain transporter à devoir signer
    const nextTransporter = (bsd.transporters ?? []).find(t => !t.takenOverAt);

    if (nextTransporter && nextTransporter.company?.orgId === currentSiret) {
      return renderSignTransportFormModal();
    }

    // Renvoie la modale de signature de la réception si l'établissement courant
    // correspond à l'installation de destination. Si l'établissement courant est
    // à la fois le prochain transporteur multi-modal et l'installation de destination
    // on donne la priorité à la signature transporteur pour respecter le workflow.
    if (currentSiret === bsd.recipient?.company?.siret) {
      return (
        <SignReception
          title={renderTitle()}
          formId={bsd.id}
          onModalCloseFromParent={onClose}
          isModalOpenFromParent={isOpen}
          displayActionButton={false}
        />
      );

      //TODO: revoir l'affichage de la modale d'annexe 1
      // const bsdDisplay = mapBsdd(bsd);
      // if (isAppendix1(bsdDisplay)) {
      //   return renderAddAppendix1Modal();
      // }
    }
  };

  const renderContentTempStored = () => {
    return (
      <SignReception
        title={renderTitle()}
        formId={bsd.id}
        onModalCloseFromParent={onClose}
        isModalOpenFromParent={isOpen}
        displayActionButton={false}
      />
    );
  };

  const renderContentTempStorerAccepted = () => {
    return renderMarkAsProcessedModal();
  };

  const renderContentAccepted = () => {
    return renderMarkAsProcessedModal();
  };

  const renderContentSignedTempStorer = () => {
    return renderSignTransportFormModal();
  };

  const renderContentResent = () => {
    return renderMarkAsReceivedModal();
  };

  const renderContentReceived = () => {
    return (
      <SignReception
        title={renderTitle()}
        formId={bsd.id}
        onModalCloseFromParent={onClose}
        isModalOpenFromParent={isOpen}
        displayActionButton={false}
      />
    );
  };

  const renderAddAppendix1Modal = () => {
    return (
      <TdModal
        isOpen={isOpen}
        onClose={onClose}
        ariaLabel="Ajout d'une annexe 1 au chapeau"
        wide
      >
        <Appendix1ProducerForm container={bsd} close={onClose} />
      </TdModal>
    );
  };

  return (
    <>
      {bsd.status === FormStatus.Sealed && renderContentSealed()}

      {bsd.status === FormStatus.Resealed && renderContentResealed()}

      {bsd.status === FormStatus.SignedByProducer &&
        renderContentSignedByProducer()}

      {bsd.status === FormStatus.Sent && renderContentSent()}

      {bsd.status === FormStatus.TempStored && renderContentTempStored()}

      {bsd.status === FormStatus.TempStorerAccepted &&
        renderContentTempStorerAccepted()}

      {bsd.status === FormStatus.SignedByTempStorer &&
        renderContentSignedTempStorer()}

      {bsd.status === FormStatus.Resent && renderContentResent()}

      {bsd.status === FormStatus.Received && renderContentReceived()}

      {bsd.status === FormStatus.Accepted && renderContentAccepted()}
    </>
  );
};

export default ActBsddValidation;
