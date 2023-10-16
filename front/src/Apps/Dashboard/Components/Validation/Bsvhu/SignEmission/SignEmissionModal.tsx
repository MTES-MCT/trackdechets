import { useQuery } from "@apollo/client";
import Loader from "Apps/common/Components/Loader/Loaders";
import TdModal from "Apps/common/Components/Modal/Modal";
import routes from "Apps/routes";
import { BsvhuSummary } from "dashboard/components/BSDList/BSVhu/WorkflowAction/BsvhuSummary";
import { GET_VHU_FORM } from "form/bsvhu/utils/queries";
import {
  Bsvhu,
  Query,
  QueryBsvhuArgs,
  SignatureTypeInput,
} from "generated/graphql/types";
import React, { useEffect, useState } from "react";
import { Link, generatePath } from "react-router-dom";
import FormBsvhuSignEmission from "./FormBsvhuSignEmission";

const SignEmissionModal = ({ bsvhuId, siret, isOpen, onClose }) => {
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

  const title = "Signer";

  return bsvhu ? (
    <TdModal onClose={onClose} ariaLabel={title} isOpen={isOpen}>
      <h2 className="td-modal-title">{title}</h2>
      <BsvhuSummary bsvhu={bsvhu} />
      {bsvhu.metadata?.errors?.some(
        error => error.requiredFor === SignatureTypeInput.Emission
      ) ? (
        <>
          <p className="tw-mt-2 tw-text-red-700">
            Vous devez mettre à jour le bordereau et renseigner les champs
            obligatoires avant de le signer.
          </p>
          <ul className="tw-mb-2 tw-text-red-700 tw-list-disc">
            {bsvhu.metadata?.errors.map((error, idx) => (
              <li key={idx}>{error.message}</li>
            ))}
          </ul>
          <Link
            to={generatePath(routes.dashboardv2.bsvhus.edit, {
              siret,
              id: bsvhu.id,
            })}
            className="btn btn--primary"
          >
            Mettre le bordereau à jour pour le signer
          </Link>
        </>
      ) : (
        <FormBsvhuSignEmission bsvhu={bsvhu} onClose={onClose} />
      )}
    </TdModal>
  ) : (
    <Loader />
  );
};

export default React.memo(SignEmissionModal);
