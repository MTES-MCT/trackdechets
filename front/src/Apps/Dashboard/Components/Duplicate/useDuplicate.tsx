import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import {
  Mutation,
  MutationDuplicateBsdaArgs,
  MutationDuplicateBsdasriArgs,
  MutationDuplicateBsvhuArgs,
  MutationDuplicateFormArgs,
} from "generated/graphql/types";
import {
  bsdaFragment,
  fullDasriFragment,
  fullFormFragment,
  vhuFragment,
} from "Apps/common/queries/fragments";
import { GET_BSDS } from "Apps/common/queries";

const DUPLICATE_BSDASRI = gql`
  mutation DuplicateBsdasri($id: ID!) {
    duplicateBsdasri(id: $id) {
      ...DasriFragment
    }
  }
  ${fullDasriFragment}
`;

const DUPLICATE_BSDA = gql`
  mutation DuplicateBsda($id: ID!) {
    duplicateBsda(id: $id) {
      ...BsdaFragment
    }
  }
  ${bsdaFragment}
`;

const DUPLICATE_FORM = gql`
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      ...FullForm
    }
  }
  ${fullFormFragment}
`;

const DUPLICATE_BSFF = gql`
  mutation DuplicateBsff($id: ID!) {
    duplicateBsff(id: $id) {
      id
    }
  }
`;

const DUPLICATE_BSVHU = gql`
  mutation DuplicateBsvhu($id: ID!) {
    duplicateBsvhu(id: $id) {
      ...VhuFragment
    }
  }
  ${vhuFragment}
`;

const message = `Le bordereau a été dupliqué, il est disponible dans l'onglet "Brouillons"`;

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
      cogoToast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
  });
}

export function useBsdaDuplicate(
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
      cogoToast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
  });
}

export function useBsddDuplicate(
  options: MutationHookOptions<
    Pick<Mutation, "duplicateForm">,
    MutationDuplicateFormArgs
  >
) {
  return useMutation<
    Pick<Mutation, "duplicateForm">,
    MutationDuplicateFormArgs
  >(DUPLICATE_FORM, {
    ...options,
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: (...args) => {
      cogoToast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
  });
}

export function useBsffDuplicate(
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
    refetchQueries: [GET_BSDS],
    awaitRefetchQueries: true,
    onCompleted: (...args) => {
      cogoToast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
  });
}

export function useBsvhuDuplicate(
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
      cogoToast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
  });
}
