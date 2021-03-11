import React from "react";
import SlipDetailContent from "./SlipDetailContent";
import Loader from "common/components/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryFormArgs } from "generated/graphql/types";
import { useParams } from "react-router-dom";
import { GET_DETAIL_FORM } from "common/queries";
import { InlineError } from "common/components/Error";

export function RouteBSDDsView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data } = useQuery<Pick<Query, "form">, QueryFormArgs>(
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

  if (data == null) {
    return <Loader />;
  }

  return <SlipDetailContent form={data.form} />;
}
