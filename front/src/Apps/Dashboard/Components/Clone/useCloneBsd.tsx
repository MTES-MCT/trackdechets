import { MutationHookOptions, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import toast from "react-hot-toast";
import {
  Mutation,
  MutationCloneBsdArgs
} from "../../../../../../libs/front/codegen-ui/src";
import { toastApolloError } from "../../Creation/toaster";

const CLONE_BSD = gql`
  mutation cloneBsd($id: String!) {
    cloneBsd(id: $id)
  }
`;

const message = `Le bordereau a été cloné`;
const startErrorMessage = "Impossible de cloner,";
export function useCloneBsd(
  options: MutationHookOptions<Pick<Mutation, "cloneBsd">, MutationCloneBsdArgs>
) {
  return useMutation<Pick<Mutation, "cloneBsd">, MutationCloneBsdArgs>(
    CLONE_BSD,
    {
      ...options,
      onCompleted: (...args) => {
        toast.success(message);

        if (options.onCompleted) {
          options.onCompleted(...args);
        }
      },
      onError: err => {
        toastApolloError(err, startErrorMessage);
      }
    }
  );
}
