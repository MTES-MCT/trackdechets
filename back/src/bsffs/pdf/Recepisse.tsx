import * as React from "react";
import { formatDate } from "../../common/pdf";
import { BsffTransporterRecepisse } from "../../generated/graphql/types";

type Props = { recepisse: BsffTransporterRecepisse | null | undefined };

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
