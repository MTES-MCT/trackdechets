import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { Mutation, MutationDuplicateBsvhuArgs } from "@td/codegen-ui";
import { vhuFragment } from "../../../../../Apps/common/queries/fragments";

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
    onCompleted: (...args) => {
      toast.success(
        `Le bordereau a été dupliqué, il est disponible dans l'onglet "Brouillons"`
      );

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    }
  });
}
