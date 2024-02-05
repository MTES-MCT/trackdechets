import { gql, MutationHookOptions, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import {
  Mutation,
  MutationDuplicateBsdaArgs,
  MutationDuplicateBsdasriArgs,
  MutationDuplicateBsvhuArgs,
  MutationDuplicateFormArgs,
  MutationDuplicateBspaohArgs
} from "@td/codegen-ui";
import {
  bsdaFragment,
  fullDasriFragment,
  fullFormFragment,
  vhuFragment,
  fullBspaohFragment
} from "../../../common/queries/fragments";
import { toastApolloError } from "../../../../form/common/stepper/toaster";

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

const DUPLICATE_BSPAOH = gql`
  mutation DuplicateBspaoh($id: ID!) {
    duplicateBspaoh(id: $id) {
      ...BspaohFragment
    }
  }
  ${fullBspaohFragment}
`;

const message = `Le bordereau a été dupliqué, il est disponible dans l'onglet "Brouillons"`;
const startErrorMessage = "Impossible de dupliquer,";
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
    onCompleted: (...args) => {
      toast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
    onError: err => {
      toastApolloError(err, startErrorMessage);
    }
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
    onCompleted: (...args) => {
      toast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
    onError: err => {
      toastApolloError(err, startErrorMessage);
    }
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
    onCompleted: (...args) => {
      toast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
    onError: err => {
      toastApolloError(err, startErrorMessage);
    }
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
    onCompleted: (...args) => {
      toast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
    onError: err => {
      toastApolloError(err, startErrorMessage);
    }
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
    onCompleted: (...args) => {
      toast.success(message);

      if (options.onCompleted) {
        options.onCompleted(...args);
      }
    },
    onError: err => {
      toastApolloError(err, startErrorMessage);
    }
  });
}

export function useBspaohDuplicate(
  options: MutationHookOptions<
    Pick<Mutation, "duplicateBspaoh">,
    MutationDuplicateBspaohArgs
  >
) {
  return useMutation<
    Pick<Mutation, "duplicateBspaoh">,
    MutationDuplicateBspaohArgs
  >(DUPLICATE_BSPAOH, {
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
  });
}
