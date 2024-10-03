import * as React from "react";
import { formatDate } from "../../../common/pdf";

type Props = {
  recepisse:
    | {
        number?: string;
        department?: string;
        validityLimit?: Date;
      }
    | null
    | undefined;
};

export function Recepisse({ recepisse }: Readonly<Props>) {
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
