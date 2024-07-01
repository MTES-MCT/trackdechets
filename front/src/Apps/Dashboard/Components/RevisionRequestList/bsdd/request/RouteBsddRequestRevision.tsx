import { useQuery } from "@apollo/client";
import { Loader } from "../../../../../common/Components";
import { InlineError } from "../../../../../common/Components/Error/Error";
import { GET_DETAIL_FORM } from "../../../../../common/queries";
import { Query, QueryFormArgs } from "@td/codegen-ui";
import React from "react";
import { useParams } from "react-router-dom";
import { BsddRequestRevision } from "./BsddRequestRevision";

export function RouteBsddRequestRevision() {
  const { id } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<Pick<Query, "form">, QueryFormArgs>(
    GET_DETAIL_FORM,
    {
      variables: {
        id
      }
    }
  );

  if (error) return <InlineError apolloError={error} />;
  if (loading) return <Loader />;
  if (!data?.form) return null;

  return <BsddRequestRevision bsdd={data?.form} />;
}
