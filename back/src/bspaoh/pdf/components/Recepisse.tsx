import * as React from "react";
import { formatDate } from "../../../common/pdf";
import { BspaohRecepisse } from "../../../generated/graphql/types";

type Props = { readonly recepisse: BspaohRecepisse | null | undefined };

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
