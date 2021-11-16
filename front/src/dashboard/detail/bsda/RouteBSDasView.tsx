import React from "react";
import BsdaDetailContent from "./BsdaDetailContent";
import Loader from "common/components/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryBsdaArgs } from "generated/graphql/types";
import { useParams } from "react-router-dom";
import { InlineError } from "common/components/Error";
import EmptyDetail from "dashboard/detail/common/EmptyDetailView";
import { GET_BSDA } from "form/bsda/stepper/queries";

export function RouteBSDasView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(
    GET_BSDA,
    {
      variables: {
        id: formId,
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

  return <BsdaDetailContent form={data.bsda} />;
}
