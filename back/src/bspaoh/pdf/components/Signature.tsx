import * as React from "react";
import { formatDateTime, SignatureStamp } from "../../../common/pdf";
import type { Signature as SignatureType } from "@td/codegen-back";

type SignatureProps = {
  readonly signature: SignatureType | null | undefined;
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
