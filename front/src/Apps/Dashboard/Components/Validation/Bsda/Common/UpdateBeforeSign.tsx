import routes from "Apps/routes";
import React from "react";
import { Link, generatePath } from "react-router-dom";

const UpdateBeforeSign = ({ bsda, siret }) => (
  <>
    <p className="tw-m-2 tw-text-red-700">
      Vous devez mettre à jour le bordereau et renseigner les champs
      obligatoires avant de le signer.
    </p>

    <ul className="tw-mb-2 tw-text-red-700 tw-list-disc">
      {bsda.metadata?.errors.map((error, idx) => (
        <li key={idx}>{error.message}</li>
      ))}
    </ul>
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
);

export default React.memo(UpdateBeforeSign);
