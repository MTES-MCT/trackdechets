import { useQuery, NetworkStatus } from "@apollo/client";
import React from "react";
import { InlineError } from "common/components/Error";
import Loader from "common/components/Loaders";
import { Query, QueryFormsArgs } from "generated/graphql/types";
import { GET_SLIPS } from "../query";
import Slips from "../Slips";
import TabContent from "./TabContent";
import EmptyTab from "./EmptyTab";
import { statusesWithDynamicActions } from "../../constants";
import { useParams } from "react-router-dom";

export default function ActTab() {
  const { siret } = useParams<{ siret: string }>();
  const { error, data, fetchMore, refetch, networkStatus } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(GET_SLIPS, {
    variables: {
      siret,
      status: statusesWithDynamicActions,
      hasNextStep: true,
    },
    notifyOnNetworkStatusChange: true,
  });

  if (networkStatus === NetworkStatus.loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data?.forms?.length)
    return (
      <EmptyTab>
        <img src="/illu/illu_sent.svg" alt="" />
        <h4>Il n'y a aucun bordereau à signer</h4>
        <p>
          Bonne nouvelle, vous n'avez aucun bordereau à signer ! Des bordereaux
          apparaissent dans cet onglet uniquement lorsque vous avez une action à
          effectuer dans le cadre de leur cycle de vie (envoi, réception ou
          traitement...)
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
      <Slips
        siret={siret}
        forms={data.forms}
        dynamicActions={true}
        refetch={refetch}
      />
    </TabContent>
  );
}
