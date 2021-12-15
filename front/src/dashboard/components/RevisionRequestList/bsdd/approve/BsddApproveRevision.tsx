import React from "react";
import {
  Broker,
  BsddRevisionRequest,
  Mutation,
  MutationSubmitBsddRevisionRequestApprovalArgs,
  RevisionRequestStatus,
  Trader,
} from "generated/graphql/types";
import { TdModalTrigger } from "common/components/Modal";
import { ActionButton } from "common/components";
import { IconCogApproved } from "common/components/Icons";
import { RevisionField } from "./RevisionField";
import { useMutation } from "@apollo/client";
import { SUBMIT_BSDD_REVISION_REQUEST_APPROVAL } from "../query";
import { useParams } from "react-router-dom";

type Props = {
  review: BsddRevisionRequest;
};

export function BsddApproveRevision({ review }: Props) {
  const { siret } = useParams<{ siret: string }>();

  const [submitBsddRevisionRequestApproval, { loading }] = useMutation<
    Pick<Mutation, "submitBsddRevisionRequestApproval">,
    MutationSubmitBsddRevisionRequestApprovalArgs
  >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL);

  if (
    siret === review.authoringCompany.siret ||
    review.status !== RevisionRequestStatus.Pending
  ) {
    return null;
  }

  return (
    <TdModalTrigger
      ariaLabel="Acceptation d'une révision"
      trigger={open => (
        <ActionButton icon={<IconCogApproved size="24px" />} onClick={open}>
          Approbation
        </ActionButton>
      )}
      modalContent={close => (
        <div>
          <p className="tw-pb-6">
            L'entreprise <strong>{review.authoringCompany.name}</strong> propose
            les révisions suivantes pour le bordereau{" "}
            <strong>#{review.bsdd.readableId}</strong>
          </p>

          <div className="tw-flex tw-py-2">
            <p className="tw-w-1/4 tw-font-bold">Commentaire</p>
            <p className="tw-w-3/4">{review.comment}</p>
          </div>

          <RevisionField
            label="Code déchet"
            bsddValue={review.bsdd.wasteDetails?.code}
            reviewValue={review.content.wasteDetails?.code}
          />

          <RevisionField
            label="POP"
            bsddValue={review.bsdd.wasteDetails?.pop}
            reviewValue={review.content.wasteDetails?.pop}
            formatter={booleanFormatter}
          />

          <RevisionField
            label="CAP"
            bsddValue={review.bsdd.recipient?.cap}
            reviewValue={review.content.recipient?.cap}
          />

          <RevisionField
            label="Poids reçu"
            bsddValue={review.bsdd.quantityReceived}
            reviewValue={review.content.quantityReceived}
          />

          <RevisionField
            label="Opération réalisée"
            bsddValue={review.bsdd.processingOperationDone}
            reviewValue={review.content.processingOperationDone}
          />

          <RevisionField
            label="Courtier"
            bsddValue={review.bsdd.broker}
            reviewValue={review.content.broker}
            formatter={traderAndBrokerFormatter}
          />

          <RevisionField
            label="Négociant"
            bsddValue={review.bsdd.trader}
            reviewValue={review.content.trader}
            formatter={traderAndBrokerFormatter}
          />

          <div className="form__actions">
            <button
              type="button"
              className="btn btn--outline-primary"
              onClick={async () => {
                await submitBsddRevisionRequestApproval({
                  variables: { id: review.id, isApproved: false },
                });
                close();
              }}
              disabled={loading}
            >
              Refuser
            </button>

            <button
              type="submit"
              className="btn btn--primary"
              onClick={async () => {
                await submitBsddRevisionRequestApproval({
                  variables: { id: review.id, isApproved: true },
                });
                close();
              }}
              disabled={loading}
            >
              Accepter
            </button>
          </div>
        </div>
      )}
    />
  );
}

function traderAndBrokerFormatter(
  entity: Trader | Broker | undefined
): React.ReactNode {
  if (!entity?.company?.name) return null;

  return (
    <>
      <div>
        {entity.company?.name} ({entity.company?.siret}) -{" "}
        {entity.company?.address}
      </div>
      <div>
        Récepissé: {entity.receipt} - Département: {entity.department} - Date
        limite de validité: {entity.validityLimit}
      </div>
    </>
  );
}

function booleanFormatter(entity: boolean | undefined): React.ReactNode {
  if (!entity) return null;

  return entity ? "Oui" : "Non";
}
