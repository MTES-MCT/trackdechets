import { useQuery } from "@apollo/react-hooks";
import React, { useContext } from "react";
import { InlineError } from "../../../common/Error";
import Loader from "../../../common/Loader";
import {
  FormStatus,
  Query,
  QueryFormsArgs,
} from "../../../generated/graphql/types";
import { SiretContext } from "../../Dashboard";
import { GET_SLIPS } from "../query";
import Slips from "../Slips";
import LoadMore from "./LoadMore";

export default function FollowTab() {
  const { siret } = useContext(SiretContext);
  const { loading, error, data, fetchMore } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(GET_SLIPS, {
    variables: {
      siret,
      status: [
        FormStatus.Sealed,
        FormStatus.Sent,
        FormStatus.Received,
        FormStatus.TempStored,
        FormStatus.Resealed,
        FormStatus.Resent,
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

  return (
    <>
      <Slips siret={siret} forms={data.forms} />
      <LoadMore forms={data.forms} fetchMore={fetchMore} />
    </>
  );
}
