import React from "react";
import BSDDetailContent from "./BSDDetailContent";
import Loader from "common/components/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryFormArgs } from "generated/graphql/types";
import { useParams } from "react-router-dom";
import { GET_DETAIL_FORM } from "common/queries";
import { InlineError } from "common/components/Error";
import EmptyDetail from "dashboard/detail/common/EmptyDetailView";

export function RouteBSDDsView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<Pick<Query, "form">, QueryFormArgs>(
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

  if (error) {
    return <InlineError apolloError={error} />;
  }

  if (loading) {
    return <Loader />;
  }
  if (data == null) {
    return <EmptyDetail />;
  }

  return <BSDDetailContent form={data.form} />;
}
