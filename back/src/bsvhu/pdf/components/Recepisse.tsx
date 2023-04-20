import * as React from "react";
import { formatDate } from "../../../common/pdf";
import { BsdaRecepisse } from "../../../generated/graphql/types";

type Props = { recepisse: BsdaRecepisse | null | undefined };

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
