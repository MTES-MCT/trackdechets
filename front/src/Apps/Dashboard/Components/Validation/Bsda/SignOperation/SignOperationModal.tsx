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
import { Link, generatePath } from "react-router-dom";
import routes from "Apps/routes";
import TdModal from "Apps/common/Components/Modal/Modal";
import FormBsdaSignOperation from "./FormBsdaSignOperation";
import { BsdaSummary } from "dashboard/components/BSDList/BSDa/WorkflowAction/BsdaSummary";

const SignOperationModal = ({ bsdaId, siret, isOpen, onClose }) => {
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
        // @ts-ignore
        error => error.requiredFor === SignatureTypeInput.Emission
      ) ? (
        <>
          <p className="tw-mt-2 tw-text-red-700">
            Vous devez mettre à jour le bordereau et renseigner les champs
            obligatoires avant de le signer.
          </p>

          <Link
            to={generatePath(routes.dashboardv2.bsdas.edit, {
              siret,
              id: bsda.id,
            })}
            className="btn btn--primary"
          >
            Mettre le bordereau à jour pour le signer
          </Link>
        </>
      ) : (
        <FormBsdaSignOperation bsda={bsda} onClose={onClose} />
      )}
    </TdModal>
  ) : (
    <Loader />
  );
};

export default React.memo(SignOperationModal);
