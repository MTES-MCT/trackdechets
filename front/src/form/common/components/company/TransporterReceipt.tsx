import React from "react";
import { formatDate } from "common/datetime";
import {
  Transporter,
  BsdaTransporter,
  BsdasriTransporter,
  BsvhuTransporter,
  BsffTransporter,
  Scalars,
} from "generated/graphql/types";
import { Maybe } from "graphql/jsutils/Maybe";

interface UniversalRecepisse {
  /** Numéro de récépissé */
  number: string;
  /** Département */
  department: string;
  /** Date limite de validité */
  validityLimit?: Maybe<Scalars["DateTime"]>;
}

type NotFormTransporter =
  | Maybe<BsdaTransporter>
  | Maybe<BsdasriTransporter>
  | Maybe<BsvhuTransporter>
  | Maybe<BsffTransporter>;

type UniversalTransporter = Maybe<Transporter> | NotFormTransporter;

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
    <>
      <h4 className="form__section-heading">
        Récépissé de déclaration de transport de déchets
      </h4>
      {recepisse.number ? (
        <p>
          Numéro {recepisse.number}, départment {recepisse.department}, date
          limite de validité {formatDate(recepisse.validityLimit!)}
        </p>
      ) : (
        <p>
          L'entreprise de transport n'a pas complété ces informations dans son
          profil. Nous ne pouvons pas afficher les information. Il lui
          appartient de les compléter.
        </p>
      )}
    </>
  );
}
