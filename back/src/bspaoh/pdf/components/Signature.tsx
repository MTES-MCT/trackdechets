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
        <span>Nom : {signature?.author}</span>
      </p>
      <p>
        <span>Horodatage signature : {formatDateTime(signature?.date)}</span>
      </p>
      {signature?.date && <SignatureStamp />}
    </>
  );
}
