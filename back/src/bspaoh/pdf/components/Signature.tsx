import * as React from "react";
import { formatDateTime, SignatureStamp } from "../../../common/pdf";
import { Signature } from "../../../generated/graphql/types";

type SignatureProps = {
  readonly signature: Signature | null | undefined;
};
export function Signature({ signature }: SignatureProps) {
  return (
    <>
      <p>
        <span className="Row">
          <span className="Col">Nom : {signature?.author}</span>
          <span className="Col">Date : {formatDateTime(signature?.date)}</span>
        </span>
      </p>
      {signature?.date && <SignatureStamp />}
    </>
  );
}
