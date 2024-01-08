import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { Mutation, MutationDuplicateBsdaArgs } from "@td/codegen-ui";
import { bsdaFragment } from "../../../../../Apps/common/queries/fragments";
import { GET_BSDS } from "../../../../../Apps/common/queries";

const DUPLICATE_BSDA = gql`
  mutation DuplicateBsda($id: ID!) {
    duplicateBsda(id: $id) {
      ...BsdaFragment
    }
  }
  ${bsdaFragment}
`;

export function useDuplicate(
  options: MutationHookOptions<
    Pick<Mutation, "duplicateBsda">,
    MutationDuplicateBsdaArgs
  >
) {
  return useMutation<
    Pick<Mutation, "duplicateBsda">,
    MutationDuplicateBsdaArgs
  >(DUPLICATE_BSDA, {
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
