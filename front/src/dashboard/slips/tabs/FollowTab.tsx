import { useQuery } from "@apollo/react-hooks";
import React from "react";
import { InlineError } from "../../../common/Error";
import Loader from "../../../common/Loader";
import { GET_SLIPS } from "../query";
import Slips from "../Slips";

export default function FollowTab({ siret }) {
  const { loading, error, data } = useQuery(GET_SLIPS, {
    variables: {
      siret,
      status: [
        "SEALED",
        "SENT",
        "RECEIVED",
        "TEMP_STORED",
        "RESEALED",
        "RESENT",
      ],
      hasNextStep: false,
    },
  });

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data?.forms?.length)
    return (
      <div className="empty-tab">
        <img src="/illu/illu_transfer.svg" alt="" />
        <h4>Il n'y a aucun bordereau à suivre</h4>
        <p>
          Des bordereaux apparaissent dans cet onglet lorsqu'ils sont en attente
          d'une action extérieure. Par exemple lorsqu'en tant que producteur
          vous attendez la réception d'un déchet ou son traitement. La colonne{" "}
          <strong>STATUT</strong> vous renseignera sur l'état précis du
          bordereau.
        </p>
      </div>
    );

  return <Slips siret={siret} forms={data.forms} />;
}
