import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import { Mutation, MutationDuplicateBsdasriArgs } from "codegen-ui";
import { fullDasriFragment } from "../../../../../Apps/common/queries/fragments";
import { GET_BSDS } from "../../../../../Apps/common/queries";

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
      toast.success(
        `Le bordereau a été dupliqué, il est disponible dans l'onglet "Brouillons"`
      );

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    }
  });
}
