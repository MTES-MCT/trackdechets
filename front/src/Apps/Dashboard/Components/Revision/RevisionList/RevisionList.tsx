import React from "react";
import { ReviewInterface } from "../revisionMapper";
import RevisionDetailList from "../RevisionDetail/RevisionDetailList";
import Badge from "../../../../Dashboard/Components/Badge/Badge";
import { formatDate } from "../../../../../common/datetime";
import ActorStatus from "../ActorStatus/ActorSatus";
import "./revisionList.scss";
import { COMMENTAIRES } from "../wordingsRevision";

interface RevisionListProps {
  reviews: ReviewInterface[] | undefined;
  title: string;
}
const RevisionList = ({ reviews, title }: RevisionListProps) => {
  const latestRevision = reviews?.[0];

  return (
    <div className="revision-list">
      <p className="revision-list__title">
        {title} {latestRevision?.readableId}
      </p>

      {latestRevision?.isCanceled ? (
        <>
          <p>
            L'entreprise
            <strong>{latestRevision?.authoringCompany?.name}</strong> a demandé
            l'annulation du bordereau
          </p>
          <div className="revision-list__comments">
            <p>{COMMENTAIRES}</p>
            <ul>
              <li>{latestRevision.comment}</li>
            </ul>
          </div>
        </>
      ) : (
        reviews?.map(review => (
          <React.Fragment key={review.id}>
            <div className="revision-list__status">
              <h3>{formatDate(review.createdAt)}</h3>
              <Badge reviewStatus={review.status} />
            </div>
            <RevisionDetailList details={review.details} />
            <div className="revision-list__comments">
              <p>{COMMENTAIRES}</p>
              <ul>
                <li>{review.comment}</li>
              </ul>
            </div>
            <ActorStatus review={review} />
            <hr />
          </React.Fragment>
        ))
      )}
    </div>
  );
};
export default RevisionList;
