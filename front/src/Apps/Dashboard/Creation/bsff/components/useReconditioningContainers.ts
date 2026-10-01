import { useQuery } from "@apollo/client";
import {
  BsffOperationCode,
  BsffPackagingWhere,
  Query,
  QueryBsffPackagingsArgs
} from "@td/codegen-ui";
import { GET_PREVIOUS_PACKAGINGS } from "../../../../common/queries/bsff/queries";
import { MAX_BSFF_COUNT_TABLE_DISPLAY } from "./BsffSelectableWasteTable";
import { ReconditioningContainer } from "../utils/reconditionnement";


export function useReconditioningContainers(
  siret: string | null | undefined,
  bsffId?: string | null
) {
  const baseWhere: BsffPackagingWhere = {
    operation: {
      code: { _in: [BsffOperationCode.D14] },
      noTraceability: false
    },
    bsff: { destination: { company: { siret: { _eq: siret } } } },
    nextBsff: null
  };
  const where = bsffId
    ? {
        _or: [baseWhere, { ...baseWhere, nextBsff: { id: { _eq: bsffId } } }]
      }
    : baseWhere;
  const { data, loading, error } = useQuery<
    Pick<Query, "bsffPackagings">,
    QueryBsffPackagingsArgs
  >(GET_PREVIOUS_PACKAGINGS, {
    variables: { where, first: MAX_BSFF_COUNT_TABLE_DISPLAY },
    skip: !siret,
    fetchPolicy: "network-only"
  });
  const containers: ReconditioningContainer[] =
    data?.bsffPackagings.edges.map(edge => edge.node) ?? [];
  return {
    containers,
    total: data?.bsffPackagings.totalCount ?? 0,
    loading,
    error
  };
}
