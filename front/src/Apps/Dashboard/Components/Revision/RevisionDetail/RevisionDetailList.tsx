import React from "react";
import RevisionDetail from "./RevisionDetail";
import { ReviewDetailInterface } from "../revisionMapper";
interface RevisionDetailListProps {
  details: ReviewDetailInterface[];
}
const RevisionDetailList = ({ details }: RevisionDetailListProps) => {
  return (
    <div>
      {details?.map((detail, i) => (
        <React.Fragment key={i}>
          <RevisionDetail
            dataName={detail.dataName}
            dataOldValue={detail.dataOldValue}
            dataNewValue={detail.dataNewValue}
          />
        </React.Fragment>
      ))}
    </div>
  );
};

export default RevisionDetailList;
