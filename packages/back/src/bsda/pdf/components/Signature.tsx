import * as React from "react";
import { formatDate, SignatureStamp } from "../../../common/pdf";
import { Signature } from "@trackdechets/codegen/src/back.gen";

type Props = {
  signature: Signature;
};
export function Signature({ signature }: Props) {
  return (
    <>
      <p>
        Je soussigné {signature?.author} certifie que les renseignements portés
        dans les cadres ci-dessus sont exacts et de bonne foi.
      </p>
      <p>
        <span className="Row">
          <span className="Col">Date : {formatDate(signature?.date)}</span>
          <span className="Col">Signature :</span>
        </span>
      </p>
      {signature?.date && <SignatureStamp />}
    </>
  );
}
