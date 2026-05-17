import { useQuery } from "@apollo/client";
import { Loader } from "../../../../../common/Components";
import { InlineError } from "../../../../../common/Components/Error/Error";
import { GET_BSFF_FORM } from "../../../../../common/queries/bsff/queries";
import { Query, QueryBsffArgs } from "@td/codegen-ui";
import React from "react";
import { useParams } from "react-router-dom";
import { BsffRequestRevision } from "./BsffRequestRevision";

export function RouteBsffRequestRevision() {
  const { id } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<Pick<Query, "bsff">, QueryBsffArgs>(
    GET_BSFF_FORM,
    {
      variables: {
        id: id!
      }
    }
  );

  if (error) return <InlineError apolloError={error} />;
  if (loading) return <Loader />;
  if (!data?.bsff) return null;

  return <BsffRequestRevision bsff={data?.bsff} />;
}
