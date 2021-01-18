import { useQuery, NetworkStatus } from "@apollo/client";
import React from "react";
import { InlineError } from "common/components/Error";
import Loader from "common/components/Loaders";
import { Query, QueryFormsArgs } from "generated/graphql/types";
import { FOLLOW_TAB_FORMS } from "./queries";
import Slips, { SlipsColumn } from "../Slips";
import TabContent from "./TabContent";
import EmptyTab from "./EmptyTab";
import { useParams } from "react-router-dom";

export default function FollowTab() {
  const { siret } = useParams<{ siret: string }>();
  const { error, data, fetchMore, refetch, networkStatus } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(FOLLOW_TAB_FORMS, {
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
