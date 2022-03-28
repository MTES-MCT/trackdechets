import * as React from "react";
import { formatDate } from "../../../common/pdf";
import { BsdaRecepisse } from "../../../generated/graphql/types";

type Props = { recepisse: BsdaRecepisse };

export function Recepisse({ recepisse }: Props) {
  return (
    <p>
      Récépissé n° : {recepisse?.number}
      <br />
      Département : {recepisse?.department}
      <br />
      Limite de validité : {formatDate(recepisse?.validityLimit)}
    </p>
  );
}
