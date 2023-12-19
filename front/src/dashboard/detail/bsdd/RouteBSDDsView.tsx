import React from "react";
import BSDDetailContent from "./BSDDetailContent";
import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryFormArgs } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import { GET_DETAIL_FORM } from "../../../Apps/common/queries";
import { InlineError } from "../../../Apps/common/Components/Error/Error";
import EmptyDetail from "../common/EmptyDetailView";

export function RouteBSDDsView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<Pick<Query, "form">, QueryFormArgs>(
    GET_DETAIL_FORM,
    {
      variables: {
        id: formId,
        readableId: null
      },
      skip: !formId,
      fetchPolicy: "network-only"
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
