import { useQuery } from "@apollo/client";
import { Loader } from "Apps/common/Components";
import { InlineError } from "Apps/common/Components/Error/Error";
import { GET_BSDA } from "form/bsda/stepper/queries";
import { Query, QueryBsdaArgs } from "generated/graphql/types";
import React from "react";
import { useParams } from "react-router-dom";
import { BsdaRequestRevision } from "./BsdaRequestRevision";

export function RouteBsdaRequestRevision() {
  const { id } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<Pick<Query, "bsda">, QueryBsdaArgs>(
    GET_BSDA,
    {
      variables: {
        id,
      },
    }
  );

  if (error) return <InlineError apolloError={error} />;
  if (loading) return <Loader />;
  if (!data?.bsda) return null;

  return <BsdaRequestRevision bsda={data?.bsda} />;
}
