import * as React from "react";
import { formatDate } from "../../../common/pdf";

type Props = {
  recepisse:
    | {
        number?: string | number | null;
        department?: string | null;
        validityLimit?: Date | null;
      }
    | null
    | undefined;
};

export function Recepisse({ recepisse }: Readonly<Props>) {
  return (
    <p>
      Récépissé n° : {recepisse?.number ?? "-"}
      <br />
      Département : {recepisse?.department ?? "-"}
      <br />
      Limite de validité : {formatDate(recepisse?.validityLimit)}
    </p>
  );
}
