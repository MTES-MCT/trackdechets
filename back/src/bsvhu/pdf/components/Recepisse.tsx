import * as React from "react";
import { formatDate } from "../../../common/pdf";
import { BsvhuRecepisse } from "../../../generated/graphql/types";

type Props = { recepisse: BsvhuRecepisse | null | undefined };

export function Recepisse({ recepisse }: Props) {
  return (
    <>
      <p className="mb-3">Récépissé n° : {recepisse?.number}</p>
      <div>
        <p className="mb-3">Département : {recepisse?.department}</p>
        <p className="mb-3">
          Date limite de validité : {formatDate(recepisse?.validityLimit)}
        </p>
      </div>
    </>
  );
}
