import { useQuery } from "@apollo/react-hooks";
import { NetworkStatus } from "apollo-client";
import React, { useContext } from "react";
import { InlineError } from "common/components/Error";
import Loader from "common/components/Loaders";
import { FormStatus, Query, QueryFormsArgs } from "generated/graphql/types";
import { SiretContext } from "dashboard/Dashboard";
import { GET_SLIPS } from "../query";
import Slips from "../Slips";
import TabContent from "./TabContent";
import EmptyTab from "./EmptyTab";
export default function FollowTab() {
  const { siret } = useContext(SiretContext);
  const { error, data, fetchMore, refetch, networkStatus } = useQuery<
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
        FormStatus.AwaitingGroup,
      ],
      hasNextStep: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  if (networkStatus === NetworkStatus.loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data?.forms?.length)
    return (
      <EmptyTab>
        <img src="/illu/illu_transfer.svg" alt="" />
        <h4>Il n'y a aucun bordereau à suivre</h4>
        <p>
          Des bordereaux apparaissent dans cet onglet lorsqu'ils sont en attente
          d'une action extérieure. Par exemple lorsqu'en tant que producteur
          vous attendez la réception d'un déchet ou son traitement. La colonne{" "}
          <strong>STATUT</strong> vous renseignera sur l'état précis du
          bordereau.
        </p>
      </EmptyTab>
    );

  return (
    <TabContent
      networkStatus={networkStatus}
      refetch={refetch}
      forms={data.forms}
      fetchMore={fetchMore}
    >
      <Slips siret={siret} forms={data.forms} refetch={refetch} />
    </TabContent>
  );
}
