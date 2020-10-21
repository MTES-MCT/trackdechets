import { useQuery } from "@apollo/react-hooks";
import { NetworkStatus } from "apollo-client";
import React, { useContext } from "react";

import { DuplicateFile } from "common/components/Icons";
import { Link } from "react-router-dom";
import { InlineError } from "common/components/Error";
import Loader from "common/components/Loaders";
import { FormStatus, Query, QueryFormsArgs } from "generated/graphql/types";
import { SiretContext } from "../../Dashboard";
import { GET_SLIPS } from "../query";
import Slips from "../Slips";

import TabContent from "./TabContent";
import { COLORS } from "common/config";
import EmptyTab from "./EmptyTab";
import { routes } from "common/routes";

export default function DraftsTab() {
  const { siret } = useContext(SiretContext);
  const { error, data, fetchMore, refetch, networkStatus } = useQuery<
    Pick<Query, "forms">,
    Partial<QueryFormsArgs>
  >(GET_SLIPS, {
    variables: { siret, status: [FormStatus.Draft] },
    notifyOnNetworkStatusChange: true,
  });

  if (networkStatus === NetworkStatus.loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;

  if (!data?.forms?.length)
    return (
      <EmptyTab>
        <img src="/illu/illu_empty.svg" alt="" />
        <h4>Il n'y a aucun bordereau en brouillon</h4>
        <p>
          Si vous le souhaitez, vous pouvez{" "}
          <Link to={routes.form.create}>
            <button className="btn btn--outline-primary btn--medium-text">
              Créer un bordereau
            </button>{" "}
          </Link>
          ou dupliquer un bordereau déjà existant dans un autre onglet grâce à
          l'icône{" "}
          <span style={{ display: "inline" }}>
            <DuplicateFile color={COLORS.blueLight} />
          </span>
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
        hiddenFields={["status", "readableId", "sentAt"]}
        dynamicActions={true}
        refetch={refetch}
      />
    </TabContent>
  );
}
