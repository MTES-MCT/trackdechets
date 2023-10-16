import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_BSDA } from "form/bsda/stepper/queries";
import {
  Bsda,
  Query,
  QueryBsdaArgs,
  SignatureTypeInput,
} from "generated/graphql/types";
import Loader from "Apps/common/Components/Loader/Loaders";
import TdModal from "Apps/common/Components/Modal/Modal";
import UpdateBeforeSign from "../Common/UpdateBeforeSign";
import FormBsdaSignTransport from "./FormBsdaSignTransport";
import { BsdaSummary } from "dashboard/components/BSDList/BSDa/WorkflowAction/BsdaSummary";

const SignTransportModal = ({ bsdaId, siret, isOpen, onClose }) => {
  const [bsda, setBsda] = useState<Bsda | undefined>();

  const { data } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(GET_BSDA, {
    variables: {
      id: bsdaId,
    },
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    setBsda(data?.bsda);
  }, [data]);

  const title = "Signer le traitement";

  return bsda ? (
    <TdModal onClose={onClose} ariaLabel={title} isOpen={isOpen}>
      <h2 className="td-modal-title">{title}</h2>
      <BsdaSummary bsda={bsda} />
      {bsda.metadata?.errors?.some(
        error =>
          //@ts-ignore
          error.requiredFor === SignatureTypeInput.Transport &&
          // Transporter Receipt will be auto-completed by the transporter
          !error?.path.startsWith("transporterRecepisse") &&
          error?.path !== "transporterTransportPlates"
      ) ? (
        <UpdateBeforeSign bsda={bsda} siret={siret} />
      ) : (
        <FormBsdaSignTransport bsda={bsda} onClose={onClose} />
      )}
    </TdModal>
  ) : (
    <Loader />
  );
};

export default React.memo(SignTransportModal);
