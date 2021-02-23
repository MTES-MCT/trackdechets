import React from "react";
import SlipDetailContent from "./SlipDetailContent";
import Loader from "common/components/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryFormArgs } from "generated/graphql/types";
import { generatePath, Redirect, useParams } from "react-router-dom";
import { GET_DETAIL_FORM } from "common/queries";
import { InlineError } from "common/components/Error";
import routes from "common/routes";

export function RouteBSDDsView() {
  const { id: formId, siret } = useParams<{ id: string; siret: string }>();
  const { loading, error, data } = useQuery<Pick<Query, "form">, QueryFormArgs>(
    GET_DETAIL_FORM,
    {
      variables: {
        id: formId,
        readableId: null,
      },
      skip: !formId,
      fetchPolicy: "network-only",
    }
  );
  const form = data?.form;

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <InlineError apolloError={error} />;
  }

  if (form == null) {
    return (
      <Redirect
        to={generatePath(routes.dashboard.bsds.drafts, {
          siret,
          id: formId,
        })}
      />
    );
  }

  return <SlipDetailContent form={form} />;
}
