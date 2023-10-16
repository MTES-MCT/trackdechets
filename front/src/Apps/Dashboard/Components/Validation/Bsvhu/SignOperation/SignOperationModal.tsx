import { useQuery } from "@apollo/client";
import Loader from "Apps/common/Components/Loader/Loaders";
import TdModal from "Apps/common/Components/Modal/Modal";
import { BsvhuSummary } from "dashboard/components/BSDList/BSVhu/WorkflowAction/BsvhuSummary";
import { GET_VHU_FORM } from "form/bsvhu/utils/queries";
import { Bsvhu, Query, QueryBsvhuArgs } from "generated/graphql/types";
import React, { useEffect, useState } from "react";
import FormBsvhuSignOperation from "./FormBsvhuSignOperation";

const SignOperationModal = ({ bsvhuId, siret, isOpen, onClose }) => {
  const [bsvhu, setBsvhu] = useState<Bsvhu | undefined>();

  const { data } = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
    {
      variables: {
        id: bsvhuId,
      },
    }
  );

  useEffect(() => {
    setBsvhu(data?.bsvhu);
  }, [data]);

  const title = "Signer le traitement";

  return bsvhu ? (
    <TdModal onClose={onClose} ariaLabel={title} isOpen={isOpen}>
      <h2 className="td-modal-title">{title}</h2>
      <BsvhuSummary bsvhu={bsvhu} />

      <FormBsvhuSignOperation bsvhu={bsvhu} onClose={onClose} />
    </TdModal>
  ) : (
    <Loader />
  );
};

export default React.memo(SignOperationModal);
