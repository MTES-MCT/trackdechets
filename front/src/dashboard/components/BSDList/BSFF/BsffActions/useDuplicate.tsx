import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { Mutation, MutationDuplicateBsdaArgs } from "@td/codegen-ui";

const DUPLICATE_BSFF = gql`
  mutation DuplicateBsff($id: ID!) {
    duplicateBsff(id: $id) {
      id
    }
  }
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
  >(DUPLICATE_BSFF, {
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
