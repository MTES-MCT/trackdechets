import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import { Mutation, MutationDuplicateBsdaArgs } from "generated/graphql/types";
import { bsdaFragment } from "common/fragments";

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
