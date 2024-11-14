import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";

import { Query, QueryBsvhuArgs } from "@td/codegen-ui";
import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { GET_VHU_FORM } from "../../../Apps/common/queries/bsvhu/queries";
import { InlineError } from "../../../Apps/common/Components/Error/Error";
import EmptyDetail from "../common/EmptyDetailView";

import { BsvhuDetailContent } from "./BsvhuDetailContent";

export function RouteBsvhusView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<
    Pick<Query, "bsvhu">,
    QueryBsvhuArgs
  >(GET_VHU_FORM, {
    variables: {
      id: formId!
    },
    skip: !formId,
    fetchPolicy: "network-only"
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

  return <BsvhuDetailContent form={data.bsvhu} />;
}
