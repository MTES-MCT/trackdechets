import { RevisionRequestApprovalStatus } from "@td/codegen-ui";
import React from "react";
import { getActorName } from "../revisionServices";
import {
  IconAApprouver,
  IconApprouve,
  IconDemandeur,
  IconRefuse
} from "../../../../common/Components/Icons/Icons";

const ActorStatus = ({ review }) => {
  const approvals = review?.approvals
    ?.map(approval => getActorName(review?.bsdContent, approval?.approverSiret))
    ?.join(" ");
  return (
    <div className="revision-list__actors">
      <p className="revision-list__actors__title">Statut</p>
      <div>
        <p className="actor-label">
          <IconDemandeur />
          &nbsp;Demandeur
        </p>
        <p className="actor-name">
          {`${review.authoringCompany?.name} - ${review.authoringCompany?.siret}`}
        </p>
      </div>
      <div>
        {review?.approvals?.[0].status ===
          RevisionRequestApprovalStatus.Pending && (
          <>
            <p className="actor-label">
              <IconAApprouver />
              &nbsp;A&nbsp;approuver
            </p>
            <p className="actor-name">{approvals}</p>
          </>
        )}
      </div>
      <div>
        {review?.approvals?.[0].status ===
          RevisionRequestApprovalStatus.Refused && (
          <>
            <p className="actor-label">
              <IconRefuse />
              &nbsp; Refusée
            </p>
            <p className="actor-name">{approvals}</p>
          </>
        )}
      </div>
      <div>
        {review?.approvals?.[0].status ===
          RevisionRequestApprovalStatus.Accepted && (
          <>
            <p className="actor-label">
              <IconApprouve />
              &nbsp; Approuvée
            </p>
            <p className="actor-name">{approvals}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ActorStatus;
