import { gql, useLazyQuery, useMutation } from "@apollo/client";
import { Loader } from "common/components";
import { NotificationError } from "common/components/Error";
import TdModal from "common/components/Modal";
import { statusChangeFragment } from "common/fragments";
import { GET_BSDS } from "common/queries";
import AcceptedInfo from "dashboard/components/BSDList/BSDD/WorkflowAction/AcceptedInfo";
import ReceivedInfo from "dashboard/components/BSDList/BSDD/WorkflowAction/ReceivedInfo";
import { MarkSegmentAsReadyToTakeOver } from "dashboard/components/BSDList/BSDD/WorkflowAction/segments/MarkSegmentAsReadyToTakeOver";
import { PrepareSegment } from "dashboard/components/BSDList/BSDD/WorkflowAction/segments/PrepareSegment";
import { TakeOverSegment } from "dashboard/components/BSDList/BSDD/WorkflowAction/segments/TakeOverSegment";
import { GET_FORM } from "form/bsdd/utils/queries";
import {
  EmitterType,
  Form,
  FormStatus,
  Mutation,
  MutationMarkAsAcceptedArgs,
  MutationMarkAsTempStorerAcceptedArgs,
  QuantityType,
  Query,
  QueryFormArgs,
} from "generated/graphql/types";
import React, { useEffect } from "react";
import MarkAsProcessedModalContent from "../../../../../dashboard/components/BSDList/BSDD/WorkflowAction/MarkAsProcessedModalContent";
import SignEmissionFormModalContent from "../../../../../dashboard/components/BSDList/BSDD/WorkflowAction/SignEmissionFormModalContent";
import SignTransportFormModalContent from "../../../../../dashboard/components/BSDList/BSDD/WorkflowAction/SignTransportFormModalContent";

const MARK_TEMP_STORER_ACCEPTED = gql`
  mutation MarkAsTempStorerAccepted(
    $id: ID!
    $tempStorerAcceptedInfo: TempStorerAcceptedFormInput!
  ) {
    markAsTempStorerAccepted(
      id: $id
      tempStorerAcceptedInfo: $tempStorerAcceptedInfo
    ) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;

const MARK_AS_ACCEPTED = gql`
  mutation MarkAsAccepted($id: ID!, $acceptedInfo: AcceptedFormInput!) {
    markAsAccepted(id: $id, acceptedInfo: $acceptedInfo) {
      ...StatusChange
    }
  }
  ${statusChangeFragment}
`;
interface ActBsddValidationProps {
  bsd: Form;
  currentSiret: string;
  isOpen: boolean;
  onClose: () => void;
}
const ActBsddValidation = ({
  bsd,
  currentSiret,
  isOpen,
  onClose,
}: ActBsddValidationProps) => {
  const [getBsdd, { error: bsddGetError, data, loading: bsddGetLoading }] =
    useLazyQuery<Pick<Query, "form">, QueryFormArgs>(GET_FORM, {
      variables: {
        id: bsd.id,
        readableId: null,
      },
      fetchPolicy: "network-only",
    });

  const [
    markAsTempStorerAccepted,
    { loading: loadingTempStorer, error: errorTempStorer },
  ] = useMutation<
    Pick<Mutation, "markAsTempStorerAccepted">,
    MutationMarkAsTempStorerAcceptedArgs
  >(MARK_TEMP_STORER_ACCEPTED, {
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onError: () => {
      // The error is handled in the UI
    },
  });
  const [markAsAccepted, { loading: loadingAccepted, error: errorAccepted }] =
    useMutation<Pick<Mutation, "markAsAccepted">, MutationMarkAsAcceptedArgs>(
      MARK_AS_ACCEPTED,
      {
        refetchQueries: [GET_BSDS],
        awaitRefetchQueries: true,
        onError: () => {
          // The error is handled in the UI
        },
      }
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
      return "Valider la réception";
    }

    if (bsd.status === FormStatus.Sealed) {
      const emitterSirets = [
        bsd.emitter?.company?.siret,
        bsd.ecoOrganisme?.siret,
      ];
      const currentUserIsEmitter = emitterSirets.includes(currentSiret);
      const title = currentUserIsEmitter
        ? `Signer en tant qu'émetteur`
        : `Faire signer l'émetteur`;

      if (bsd.emitter?.type === EmitterType.Appendix1) {
        return "Valider la réception";
      }

      if (bsd.emitter?.type === EmitterType.Appendix1Producer) {
        const canSkipEmission = Boolean(bsd.ecoOrganisme?.siret);

        if (canSkipEmission) {
          return "Signature transporteur";
        } else {
          return title;
        }
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
      const isTempStorage = bsd.recipient?.isTempStorage;
      if (isTempStorage) {
        return "Valider l'entreposage provisoire";
      } else {
        return "Valider la réception";
      }
    }

    if (bsd.status === FormStatus.TempStored) {
      return "Valider l'acceptation de l'entreposage provisoire";
    }

    if (
      bsd.status === FormStatus.TempStorerAccepted ||
      bsd.status === FormStatus.Accepted
    ) {
      return "Valider le traitement";
    }

    if (bsd.status === FormStatus.Received) {
      return "Valider l'acceptation";
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
    if (bsddGetLoading) {
      return <Loader />;
    }

    if (!!data?.form) {
      return (
        <TdModal isOpen={isOpen} onClose={onClose} ariaLabel={renderTitle()}>
          <h2 className="td-modal-title">{renderTitle()}</h2>
          <ReceivedInfo
            form={data.form}
            close={onClose}
            isTempStorage={false}
          />
        </TdModal>
      );
    }
  };

  const renderMarkAsProcessedOrAcceptedModal = (onSubmit, error, loading) => {
    return (
      <TdModal isOpen={isOpen} onClose={onClose} ariaLabel={renderTitle()}>
        <h2 className="td-modal-title">{renderTitle()}</h2>
        <AcceptedInfo
          form={data?.form!}
          close={onClose}
          onSubmit={values => onSubmit(values)}
        />
        {error && (
          <NotificationError className="action-error" apolloError={error} />
        )}
        {loading && <Loader />}
      </TdModal>
    );
  };

  const renderContentSealed = () => {
    if (bsd.emitter?.type === EmitterType.Appendix1) {
      return renderMarkAsReceivedModal();
    }

    if (bsd.emitter?.type === EmitterType.Appendix1Producer) {
      const canSkipEmission = Boolean(bsd.ecoOrganisme?.siret);

      if (!canSkipEmission) {
        return renderSignEmissionFormModal();
      } else {
        return renderSignTransportFormModal();
      }
    }

    return renderSignEmissionFormModal();
  };

  const renderContentResealed = () => {
    return renderSignEmissionFormModal();
  };

  const renderContentSignedByProducer = () => {
    if (bsd.transporter?.company?.orgId === currentSiret) {
      return (
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
    }
  };

  const renderContentSent = () => {
    const isTempStorage = bsd.recipient?.isTempStorage;
    if (currentSiret === bsd.recipient?.company?.siret) {
      if (!!bsddGetLoading) {
        return <Loader />;
      }
      if (!!bsddGetError) {
        return (
          <NotificationError
            className="action-error"
            apolloError={bsddGetError}
          />
        );
      }
      if (!!data?.form) {
        return (
          <TdModal isOpen={isOpen} onClose={onClose} ariaLabel={renderTitle()}>
            <h2 className="td-modal-title">{renderTitle()}</h2>
            <ReceivedInfo
              form={data?.form}
              close={onClose}
              isTempStorage={isTempStorage as boolean}
            />
          </TdModal>
        );
      }
    }

    const transportSegments = bsd.transportSegments ?? [];
    const lastSegment = transportSegments[transportSegments.length - 1];

    if (bsd.currentTransporterOrgId === currentSiret) {
      if (
        // there are no segments yet, current transporter can create one
        lastSegment === null ||
        // the last segment was taken over and current user is the current transporter
        // which means there are no pending transfers so they can create a new segment
        lastSegment.takenOverAt
      ) {
        return <PrepareSegment form={bsd} siret={currentSiret} />;
      }
      if (
        // the last segment is still a draft
        !lastSegment.readyToTakeOver &&
        // that was created by the current user
        lastSegment.previousTransporterCompanyOrgId === currentSiret
      ) {
        return <MarkSegmentAsReadyToTakeOver form={bsd} siret={currentSiret} />;
      }
    }

    if (
      bsd.nextTransporterOrgId === currentSiret &&
      lastSegment.readyToTakeOver
    ) {
      return <TakeOverSegment form={bsd} siret={currentSiret} />;
    }
  };

  const renderContentTempStored = () => {
    if (!!bsddGetLoading) {
      return <Loader />;
    }
    if (!!bsddGetError) {
      return (
        <NotificationError
          className="action-error"
          apolloError={bsddGetError}
        />
      );
    }
    if (!!data?.form) {
      const onSubmit = values =>
        markAsTempStorerAccepted({
          variables: {
            id: bsd.id,
            tempStorerAcceptedInfo: {
              ...values,
              quantityReceived: values.quantityReceived ?? 0,
              quantityType: values.quantityType ?? QuantityType.Real,
            },
          },
        });
      return renderMarkAsProcessedOrAcceptedModal(
        onSubmit,
        errorTempStorer,
        loadingTempStorer
      );
    }
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
    if (!!bsddGetLoading) {
      return <Loader />;
    }
    if (!!bsddGetError) {
      return (
        <NotificationError
          className="action-error"
          apolloError={bsddGetError}
        />
      );
    }
    if (!!data?.form) {
      const onSubmit = values =>
        markAsAccepted({
          variables: {
            id: bsd.id,
            acceptedInfo: {
              ...values,
              quantityReceived: values.quantityReceived ?? 0,
            },
          },
        });
      return renderMarkAsProcessedOrAcceptedModal(
        onSubmit,
        errorAccepted,
        loadingAccepted
      );
    }
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
