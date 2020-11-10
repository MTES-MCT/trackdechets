import { useQuery } from "@apollo/client";
import { NetworkStatus } from "apollo-client";
import React from "react";
import { InlineError } from "common/components/Error";
import Loader from "common/components/Loaders";
import { FormStatus, Query, QueryFormsArgs } from "generated/graphql/types";
import { GET_SLIPS } from "../query";
import EmptyTab from "./EmptyTab";
import Slips from "../Slips";

import TabContent from "./TabContent";
import { useParams } from "react-router-dom";

export default function HistoryTab() {
  const { siret } = useParams<{ siret: string }>();
  const { error, data, fetchMore, refetch, networkStatus } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(GET_SLIPS, {
    variables: {
      siret,
      status: [
        FormStatus.Processed,
        FormStatus.NoTraceability,
        FormStatus.Refused,
      ],
    },
    notifyOnNetworkStatusChange: true,
  });

  if (networkStatus === NetworkStatus.loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  if (!data?.forms?.length)
    return (
      <EmptyTab>
        <img src="/illu/illu_hello.svg" alt="" />
        <h4>Il n'y a aucun bordereau en archive</h4>
        <p>
          Des bordereaux apparaissent dans cet onnglet lorsqu'ils terminé leur
          cycle de vie. Ils sont alors disponible en lecture seule pour
          consultation.
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
      <Slips siret={siret} forms={data.forms} />
    </TabContent>
  );
}
