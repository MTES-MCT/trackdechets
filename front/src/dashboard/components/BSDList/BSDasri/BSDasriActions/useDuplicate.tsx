import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import {
  Mutation,
  MutationDuplicateBsdasriArgs,
} from "generated/graphql/types";
import { fullDasriFragment } from "Apps/common/queries/fragments";
import { GET_BSDS } from "Apps/common/queries";

const DUPLICATE_BSDASRI = gql`
  mutation DuplicateBsdasri($id: ID!) {
    duplicateBsdasri(id: $id) {
      ...DasriFragment
    }
  }
  ${fullDasriFragment}
`;

export function useBsdasriDuplicate(
  options: MutationHookOptions<
    Pick<Mutation, "duplicateBsdasri">,
    MutationDuplicateBsdasriArgs
  >
) {
  return useMutation<
    Pick<Mutation, "duplicateBsdasri">,
    MutationDuplicateBsdasriArgs
  >(DUPLICATE_BSDASRI, {
    ...options,
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: (...args) => {
      cogoToast.success(
        `Le bordereau a été dupliqué, il est disponible dans l'onglet "Brouillons"`
      );

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
  });
}
