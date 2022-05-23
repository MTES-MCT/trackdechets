import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";

import { Query, QueryBsffArgs } from "@trackdechets/codegen/src/front.gen";
import Loader from "common/components/Loaders";
import { GET_BSFF_FORM } from "form/bsff/utils/queries";
import { InlineError } from "common/components/Error";
import EmptyDetail from "dashboard/detail/common/EmptyDetailView";

import { BsffDetailContent } from "./BsffDetailContent";

export function RouteBsffsView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: {
        id: formId
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

  return <BsffDetailContent form={data.bsff} />;
}
