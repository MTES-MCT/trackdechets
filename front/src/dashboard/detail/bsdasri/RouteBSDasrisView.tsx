import React from "react";
import BsdasriDetailContent from "./BsdasriDetailContent";
import Loader from "common/components/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryBsdasriArgs } from "generated/graphql/types";
import { useParams } from "react-router-dom";
import { GET_DETAIL_DASRI } from "common/queries";
import { InlineError } from "common/components/Error";

export function RouteBSDasrisView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data } = useQuery<Pick<Query, "bsdasri">, QueryBsdasriArgs>(
    GET_DETAIL_DASRI,
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

  if (data == null) {
    return <Loader />;
  }

  return <BsdasriDetailContent form={data.bsdasri} />;
}
