import { useQuery, NetworkStatus } from "@apollo/client";
import React from "react";
import { InlineError } from "common/components/Error";
import Loader from "common/components/Loaders";
import { Query, QueryFormsArgs } from "generated/graphql/types";
import { HISTORY_TAB_FORMS } from "./queries";
import EmptyTab from "./EmptyTab";
import Slips, { SlipsColumn } from "../Slips";

import TabContent from "./TabContent";
import { useParams } from "react-router-dom";

export default function HistoryTab() {
  const { siret } = useParams<{ siret: string }>();
  const { error, data, fetchMore, refetch, networkStatus } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(HISTORY_TAB_FORMS, {
    variables: {
      siret,
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
      <Slips
        siret={siret}
        forms={data.forms}
        columns={[
          SlipsColumn.READABLE_ID,
          SlipsColumn.SENT_AT,
          SlipsColumn.EMITTER_COMPANY_NAME,
          SlipsColumn.RECIPIENT_COMPANY_NAME,
          SlipsColumn.WASTE_DETAILS_CODE,
          SlipsColumn.QUANTITY,
          SlipsColumn.STATUS,
          SlipsColumn.SLIPS_ACTIONS,
        ]}
      />
    </TabContent>
  );
}
