import React, { useMemo } from "react";
import { formatDate } from "common/datetime";
import {
  Transporter,
  Scalars,
  BsffTransporterInput,
  BsdasriTransporterInput,
  BsdaTransporterInput,
  BsvhuTransporterInput,
  TransporterInput,
  BsdaTransporter,
  BsffTransporter,
  BsdasriTransporter,
  BsvhuTransporter,
} from "generated/graphql/types";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { isForeignVat } from "generated/constants/companySearchHelpers";
import { BsffFormTransporterInput } from "form/bsff/utils/initial-state";

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

type UniversalTransporter =
  | TransporterInput
  | NotFormTransporter
  | BsffTransporter;

export default function TransporterReceipt({
  transporter,
}: {
  transporter: UniversalTransporter;
}) {
  /**
   * Universal Receipt exemption detection
   */
  const isExemptedOfReceipt: boolean = useMemo(() => {
    if (!!(transporter as Transporter)?.isExemptedOfReceipt) {
      return !!(transporter as Transporter).isExemptedOfReceipt;
    } else if (!!(transporter as BsdaTransporter)?.recepisse?.isExempted) {
      return !!(transporter as BsdaTransporter)?.recepisse?.isExempted;
    } else if (!!(transporter as BsvhuTransporter)?.recepisse?.isExempted) {
      return !!(transporter as BsvhuTransporter)?.recepisse?.isExempted;
    } else if (!!(transporter as BsdasriTransporter)?.recepisse?.isExempted) {
      return !!(transporter as BsdasriTransporter)?.recepisse?.isExempted;
    } else if (
      !!(transporter as BsffFormTransporterInput)?.isExemptedOfRecepisse
    ) {
      return !!(transporter as BsffFormTransporterInput).isExemptedOfRecepisse;
    } else if (
      !!(transporter as BsffTransporter)?.company?.orgId &&
      (transporter as BsffTransporter)?.recepisse === null
    ) {
      // specific for the Bsff transporter signature dialog where recepisse === null means exempted
      return true;
    } else {
      return false;
    }
  }, [transporter]);

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
  return !isExemptedOfReceipt &&
    !isForeignVat(transporter.company?.vatNumber!!) ? (
    <div className="fr-grid-row fr-mb-2w fr-mt-2w">
      <Alert
        title={"Récépissé de déclaration de transport de déchets"}
        severity={recepisse.number?.length ? "info" : "error"}
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
    </div>
  ) : (
    <></>
  );
}
