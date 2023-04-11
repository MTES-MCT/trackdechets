import React from "react";
import { formatDate } from "common/datetime";
import {
  Transporter,
  Scalars,
  BsffTransporterInput,
  BsdasriTransporterInput,
  BsdaTransporterInput,
  BsvhuTransporterInput,
  TransporterInput,
} from "generated/graphql/types";
import { Alert, Row } from "@dataesr/react-dsfr";

interface UniversalRecepisse {
  /** Numéro de récépissé */
  number: string;
  /** Département */
  department: string;
  /** Date limite de validité */
  validityLimit?: Scalars["DateTime"];
}

export type NotFormTransporter =
  | BsdaTransporterInput
  | BsdasriTransporterInput
  | BsvhuTransporterInput
  | BsffTransporterInput;

type UniversalTransporter = TransporterInput | NotFormTransporter;

export default function TransporterReceipt({
  transporter,
}: {
  transporter: UniversalTransporter;
}) {
  const recepisse: UniversalRecepisse = {
    number:
      (transporter as Transporter).receipt ??
      (transporter as NotFormTransporter)?.recepisse?.number ??
      "",
    department:
      (transporter as Transporter).department ??
      (transporter as NotFormTransporter)?.recepisse?.department ??
      "",
    validityLimit:
      (transporter as Transporter).validityLimit ??
      (transporter as NotFormTransporter)?.recepisse?.validityLimit ??
      "",
  };
  return (
    <Row spacing="mb-2w mt-2w">
      <Alert
        title={"Récépissé de déclaration de transport de déchets"}
        type={recepisse.number?.length ? "info" : "error"}
        description={
          <>
            {recepisse.number ? (
              <p>
                Numéro: {recepisse.number}, département: {recepisse.department},
                date limite de validité: {formatDate(recepisse.validityLimit!)}.
                <br />
                Informations complétées par le transporteur dans son profil
                Trackdéchets.
              </p>
            ) : (
              <p>
                L'entreprise de transport n'a pas complété ces informations dans
                son profil Trackdéchets. Nous ne pouvons pas les afficher. Il
                lui appartient de les compléter.
              </p>
            )}
          </>
        }
      />
    </Row>
  );
}
