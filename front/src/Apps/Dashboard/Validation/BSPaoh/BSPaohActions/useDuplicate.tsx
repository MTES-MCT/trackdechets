import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { Mutation, MutationDuplicateBspaohArgs } from "@td/codegen-ui";
import { fullBspaohFragment } from "../../../../../Apps/common/queries/fragments";
import { GET_BSDS } from "../../../../../Apps/common/queries";

const DUPLICATE_BDPAOH = gql`
  mutation DuplicateBspaoh($id: ID!) {
    duplicateBspaoh(id: $id) {
      ...BspaohFragment
    }
  }
  ${fullBspaohFragment}
`;

export function useBspaohDuplicate(
  options: MutationHookOptions<
    Pick<Mutation, "duplicateBspaoh">,
    MutationDuplicateBspaohArgs
  >
) {
  return useMutation<
    Pick<Mutation, "duplicateBspaoh">,
    MutationDuplicateBspaohArgs
  >(DUPLICATE_BDPAOH, {
    ...options,
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
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
