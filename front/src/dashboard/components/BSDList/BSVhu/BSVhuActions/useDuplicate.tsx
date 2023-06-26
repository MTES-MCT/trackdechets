import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import { Mutation, MutationDuplicateBsvhuArgs } from "generated/graphql/types";
import { vhuFragment } from "Apps/common/queries/fragments";
import { GET_BSDS } from "Apps/common/queries";

const DUPLICATE_BSVHU = gql`
  mutation DuplicateBsvhu($id: ID!) {
    duplicateBsvhu(id: $id) {
      ...VhuFragment
    }
  }
  ${vhuFragment}
`;

export function useDuplicate(
  options: MutationHookOptions<
    Pick<Mutation, "duplicateBsvhu">,
    MutationDuplicateBsvhuArgs
  >
) {
  return useMutation<
    Pick<Mutation, "duplicateBsvhu">,
    MutationDuplicateBsvhuArgs
  >(DUPLICATE_BSVHU, {
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
