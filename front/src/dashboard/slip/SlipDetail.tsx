import React from "react";
import SlipDetailContent from "./SlipDetailContent";
import Loader from "common/components/Loaders";
import { useQuery } from "@apollo/client";
import { Query, QueryFormArgs } from "generated/graphql/types";
import { useParams } from "react-router-dom";
import { GET_DETAIL_FORM } from "common/queries";
import { InlineError } from "common/components/Error";

export default function SlipDetail() {
  const { id: formId } = useParams<{ id: string }>();
  const { loading, error, data } = useQuery<Pick<Query, "form">, QueryFormArgs>(
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
  const form = data?.form;
  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <InlineError apolloError={error} />;
  }
  return (
    <div>
      <SlipDetailContent form={form} />
    </div>
  );
}
