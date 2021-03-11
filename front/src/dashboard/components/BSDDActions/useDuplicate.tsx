import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import { updateApolloCache } from "common/helper";
import {
  Mutation,
  MutationDuplicateFormArgs,
  Query,
} from "generated/graphql/types";
import { DRAFT_TAB_FORMS } from "../../bsds/queries";
import { fullFormFragment } from "common/fragments";

const DUPLICATE_FORM = gql`
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

export function useDuplicate(
  options: MutationHookOptions<
    Pick<Mutation, "duplicateForm">,
    MutationDuplicateFormArgs
  >,
  siret: string
) {
  return useMutation<
    Pick<Mutation, "duplicateForm">,
    MutationDuplicateFormArgs
  >(DUPLICATE_FORM, {
    ...options,
    update: (store, { data }) => {
      const duplicateForm = data?.duplicateForm;

      if (duplicateForm == null) {
        return;
      }

      updateApolloCache<Pick<Query, "forms">>(store, {
        query: DRAFT_TAB_FORMS,
        variables: { siret },
        getNewData: data => ({
          forms: [duplicateForm, ...data.forms],
        }),
      });
    },
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
