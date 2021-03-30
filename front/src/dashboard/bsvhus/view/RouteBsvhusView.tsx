import React from "react";
import { BsvhuDetailContent } from "./BsvhuDetailContent";
import Loader from "common/components/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryBsvhuArgs } from "generated/graphql/types";
import { useParams } from "react-router-dom";
import { GET_VHU_FORM } from "form/bsvhu/utils/queries";
import { InlineError } from "common/components/Error";

export function RouteBsvhusView() {
  const { id: formId } = useParams<{ id: string }>();
  const { error, data } = useQuery<Pick<Query, "bsvhu">, QueryBsvhuArgs>(
    GET_VHU_FORM,
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

  return <BsvhuDetailContent form={data.bsvhu} />;
}
