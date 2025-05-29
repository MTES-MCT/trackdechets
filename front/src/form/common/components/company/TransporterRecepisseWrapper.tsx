import React, { useMemo } from "react";
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
  TransportMode
} from "@td/codegen-ui";
import { isForeignVat } from "@td/constants";
import { TRANSPORTER_RECEIPT } from "../../../../Apps/common/queries/company/query";
import { useQuery } from "@apollo/client";
import TransporterRecepisse from "../../../../Apps/Forms/Components/TransporterRecepisse/TransporterRecepisse";

export type NotFormTransporter =
  | BsdaTransporterInput
  | BsdasriTransporterInput
  | BsvhuTransporterInput
  | BsffTransporterInput;

type UniversalTransporter =
  | TransporterInput
  | NotFormTransporter
  | BsffTransporter;

/**
 * Ce wrapper autour de TransporterRecepisse est en charge
 * de calculer la valeur de `isExemptedOfReceipt` pour tous les types de bordereau
 * et de requêter `companyPrivateInfos` pour avoir les infos de récépissé à jour.
 */
export default function TransporterRecepisseWrapper({
  transporter,
  customClass = ""
}: {
  transporter: UniversalTransporter;
  customClass?: string;
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
    } else if (!!(transporter as BsffTransporterInput)?.recepisse?.isExempted) {
      return !!(transporter as BsffTransporterInput).recepisse?.isExempted;
    } else if (
      (transporter as BsffTransporter)?.recepisse?.isExempted === true
    ) {
      // specific for the Bsff transporter signature dialog where recepisse === null means exempted
      return true;
    } else {
      return false;
    }
  }, [transporter]);

  const isRoadTransport: boolean = useMemo(() => {
    if ((transporter as Transporter)?.mode) {
      return (transporter as Transporter).mode === TransportMode.Road;
    } else if (
      (
        transporter as
          | BsdaTransporter
          | BsdasriTransporter
          | BsffTransporterInput
      )?.transport?.mode
    ) {
      return (
        (
          transporter as
            | BsdaTransporter
            | BsdasriTransporter
            | BsffTransporterInput
        )?.transport?.mode === TransportMode.Road
      );
    } else {
      return true; // BSVHU has no transport mode, it's always road. And if we don't have a transport mode, we default to showing the alert
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
      clue: transporter?.company?.siret!
    },
    skip: !transporter?.company?.siret
  });

  const receipt: TransporterReceipt | null =
    data?.companyPrivateInfos.transporterReceipt || null;

  return !loading &&
    !isExemptedOfReceipt &&
    isRoadTransport &&
    !isForeignVat(transporter?.company?.vatNumber!) ? (
    <TransporterRecepisse
      number={receipt?.receiptNumber}
      department={receipt?.department}
      validityLimit={receipt?.validityLimit}
      customClass={customClass}
    />
  ) : null;
}
