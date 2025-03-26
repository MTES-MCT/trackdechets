import Alert from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { formatDate } from "../../../../common/datetime";

type RecepisseProps = {
  title: string;
  numero?: string | null;
  departement?: string | null;
  validityLimit?: string | null;
};

export default function Recepisse({
  title,
  numero,
  departement,
  validityLimit
}: RecepisseProps) {
  return (
    <Alert
      title={title}
      severity="info"
      description={
        <>
          Numéro : {numero}
          <br />
          Département : {departement}
          <br />
          Date limite de validité : {formatDate(validityLimit ?? "")}
        </>
      }
      closable={false}
    />
  );
}
