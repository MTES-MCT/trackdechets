import {
  BsdaRevisionRequestApproval,
  FormRevisionRequestApproval,
  BsdasriRevisionRequestApproval,
  RevisionRequestApprovalStatus
} from "@td/codegen-ui";
import React from "react";
import { getActorName } from "../revisionServices";
import {
  IconAApprouver,
  IconApprouve,
  IconDemandeur,
  IconRefuse
} from "../../../../common/Components/Icons/Icons";
import { ReviewInterface } from "../revisionMapper";

const ActorStatus = ({ review }: { review: ReviewInterface }) => {
  const approvalsGroupedByStatus = review?.approvals?.reduce(
    (acc, approval) => {
      acc[approval.status] ??= [];
      acc[approval.status].push(approval as any);
      return acc;
    },
    {} as {
      [status: string]:
        | BsdaRevisionRequestApproval[]
        | FormRevisionRequestApproval[];
    }
  );

  return (
    <div className="revision-list__actors">
      <p className="revision-list__actors__title">Statut</p>
      <div>
        <p className="actor-label">
          <IconDemandeur />
          &nbsp;Demandeur
        </p>
        <p className="actor-name">
          {`${review.authoringCompany?.name} - ${review.authoringCompany?.orgId}`}
        </p>
      </div>
      {Object.entries(approvalsGroupedByStatus).map(([status, approvals]) => (
        <div key={status}>
          {status === RevisionRequestApprovalStatus.Pending ? (
            <p className="actor-label">
              <IconAApprouver />
              &nbsp;A&nbsp;approuver
            </p>
          ) : status === RevisionRequestApprovalStatus.Refused ? (
            <p className="actor-label">
              <IconRefuse />
              &nbsp; Refusée
            </p>
          ) : (
            <p className="actor-label">
              <IconApprouve />
              &nbsp; Approuvée
            </p>
          )}

          <p className="actor-name">
            {approvals.map(
              (
                approval:
                  | BsdaRevisionRequestApproval
                  | BsdasriRevisionRequestApproval
                  | FormRevisionRequestApproval,
                index: number
              ) => (
                <p key={index}>
                  {getActorName(review?.bsdContent, approval?.approverSiret)}
                </p>
              )
            )}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ActorStatus;
