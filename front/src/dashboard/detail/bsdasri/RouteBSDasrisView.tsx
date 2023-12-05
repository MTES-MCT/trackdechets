import React from "react";
import BsdasriDetailContent from "./BsdasriDetailContent";
import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryBsdasriArgs } from "codegen-ui";
import { useParams } from "react-router-dom";
import { GET_DETAIL_DASRI } from "../../../Apps/common/queries";
import { InlineError } from "../../../Apps/common/Components/Error/Error";
import EmptyDetail from "../common/EmptyDetailView";
export function RouteBSDasrisView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<
    Pick<Query, "bsdasri">,
    QueryBsdasriArgs
  >(GET_DETAIL_DASRI, {
    variables: {
      id: formId!
    },
    skip: !formId,
    fetchPolicy: "no-cache"
  });

  if (error) {
    return <InlineError apolloError={error} />;
  }
  if (loading) {
    return <Loader />;
  }
  if (data == null) {
    return <EmptyDetail />;
  }

  return <BsdasriDetailContent form={data.bsdasri} />;
}
