import React from "react";
import BspaohDetailContent from "./BspaohDetailContent";
import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryBspaohArgs } from "@td/codegen-ui";
import { useParams } from "react-router-dom";
import { GET_BSPAOH } from "../../../form/bspaoh/utils/queries";
import { InlineError } from "../../../Apps/common/Components/Error/Error";
import EmptyDetail from "../common/EmptyDetailView";

export function RouteBspaohsView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<
    Pick<Query, "bspaoh">,
    QueryBspaohArgs
  >(GET_BSPAOH, {
    variables: {
      id: formId!
    },
    skip: !formId,
    fetchPolicy: "no-cache"
  });
  console.log(error, data, loading);
  if (error) {
    return <InlineError apolloError={error} />;
  }
  if (loading) {
    return <Loader />;
  }
  if (data == null) {
    return <EmptyDetail />;
  }

  return <BspaohDetailContent form={data.bspaoh} />;
}
