import { useQuery } from "@apollo/react-hooks";
import { NetworkStatus } from "apollo-client";
import React, { useContext } from "react";
import { InlineError } from "src/common/components/Error";
import Loader from "src/common/components/Loaders";
import { FormStatus, Query, QueryFormsArgs } from "src/generated/graphql/types";
import { SiretContext } from "src/dashboard/Dashboard";
import { GET_SLIPS } from "../query";
import EmptyTab from "./EmptyTab";
import Slips from "../Slips";

import TabContent from "./TabContent";
export default function HistoryTab() {
  const { siret } = useContext(SiretContext);
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
