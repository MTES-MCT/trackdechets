import React, { useMemo } from "react";
import { formatDate } from "common/datetime";
import {
  Transporter,
  BsffTransporterInput,
  BsdasriTransporterInput,
  BsdaTransporterInput,
  BsvhuTransporterInput,
  TransporterInput,
  BsdaTransporter,
  BsffTransporter,
  BsdasriTransporter,
  BsvhuTransporter,
  TransporterReceipt,
  Query,
  QueryCompanyPrivateInfosArgs,
} from "generated/graphql/types";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { isForeignVat } from "generated/constants/companySearchHelpers";
import { BsffFormTransporterInput } from "form/bsff/utils/initial-state";
import { TRANSPORTER_RECEIPT } from "./query";
import { useQuery } from "@apollo/client";

export type NotFormTransporter =
  | BsdaTransporterInput
  | BsdasriTransporterInput
  | BsvhuTransporterInput
  | BsffTransporterInput;

type UniversalTransporter =
  | TransporterInput
  | NotFormTransporter
  | BsffTransporter;

export default function TransporterReceiptComponent({
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

  /**
   * CompanyPrivateInfos pour completer les informations
   */
  const { data, loading } = useQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(TRANSPORTER_RECEIPT, {
    variables: {
      // Compatibility with intermediaries that don't have orgId
      clue: transporter.company?.siret!,
    },
    skip: !transporter.company?.siret,
  });

  const receipt: TransporterReceipt | null =
    data?.companyPrivateInfos.transporterReceipt || null;

  return !loading &&
    !isExemptedOfReceipt &&
    !isForeignVat(transporter.company?.vatNumber!!) ? (
    <div className="fr-grid-row fr-mb-2w fr-mt-2w">
      <Alert
        title={"Récépissé de déclaration de transport de déchets"}
        severity={receipt?.receiptNumber?.length ? "info" : "error"}
        description={
          <>
            {receipt?.receiptNumber ? (
              <p>
                Numéro: {receipt?.receiptNumber}, département:{" "}
                {receipt?.department}, date limite de validité:{" "}
                {formatDate(receipt?.validityLimit!)}.
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
