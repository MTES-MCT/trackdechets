import { useQuery } from "@apollo/client";
import { Loader } from "../../../../../common/Components";
import { InlineError } from "../../../../../common/Components/Error/Error";
import { GET_BSDASRI } from "../../../../../common/queries/bsdasri/queries";
import { Query, QueryBsdaArgs } from "@td/codegen-ui";
import React from "react";
import { useParams } from "react-router-dom";
import { BsdasriRequestRevision } from "./BsdasriRequestRevision";

export function RouteBsdasriRequestRevision() {
  const { id } = useParams<{ id: string }>();
  const { error, data, loading } = useQuery<
    Pick<Query, "bsdasri">,
    QueryBsdaArgs
  >(GET_BSDASRI, {
    variables: {
      id: id!
    }
  });

  if (error) return <InlineError apolloError={error} />;
  if (loading) return <Loader />;
  if (!data?.bsdasri) return null;

  return <BsdasriRequestRevision bsdasri={data?.bsdasri} />;
}
