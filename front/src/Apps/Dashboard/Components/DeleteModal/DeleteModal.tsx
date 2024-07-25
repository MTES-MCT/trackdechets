import React from "react";
import { IconTrash } from "../../../common/Components/Icons/Icons";
import { TOAST_DURATION } from "../../../../common/config";
import { gql, useMutation } from "@apollo/client";
import Button from "@codegouvfr/react-dsfr/Button";

import {
  BsdType,
  Mutation,
  MutationDeleteBsdaArgs,
  MutationDeleteBsdasriArgs,
  MutationDeleteBsffArgs,
  MutationDeleteBsvhuArgs,
  MutationDeleteFormArgs,
  MutationDeleteBspaohArgs
} from "@td/codegen-ui";
import toast from "react-hot-toast";
import TdModal from "../../../common/Components/Modal/Modal";
import { Loader } from "../../../common/Components";

const DELETE_BSDA = gql`
  mutation DeleteBsda($id: ID!) {
    deleteBsda(id: $id) {
      id
      status
    }
  }
`;
const DELETE_BSDASRI = gql`
  mutation DeleteBsdasri($id: ID!) {
    deleteBsdasri(id: $id) {
      id
      status
    }
  }
`;

const DELETE_FORM = gql`
  mutation DeleteForm($id: ID!) {
    deleteForm(id: $id) {
      id
      status
    }
  }
`;

const DELETE_BSFF = gql`
  mutation DeleteBsff($id: ID!) {
    deleteBsff(id: $id) {
      id
      status
    }
  }
`;

const DELETE_BSVHU = gql`
  mutation DeleteBsvhu($id: ID!) {
    deleteBsvhu(id: $id) {
      id
      status
    }
  }
`;

const DELETE_BSPAOH = gql`
  mutation DeleteBspaoh($id: ID!) {
    deleteBspaoh(id: $id) {
      id
      status
    }
  }
`;

function DeleteModal({ bsdId, bsdType, isOpen, onClose }) {
  const messageSuccess = "Bordereau supprimé";
  const messageError = "Le bordereau n'a pas pu être supprimé";
  const [deleteBsda, { loading: deletingBsda }] = useMutation<
    Pick<Mutation, "deleteBsda">,
    MutationDeleteBsdaArgs
  >(DELETE_BSDA, {
    variables: { id: bsdId },
    onCompleted: () => {
      toast.success(messageSuccess, { duration: TOAST_DURATION });
      !!onClose && onClose();
    },
    onError: () =>
      toast.error(messageError, {
        duration: TOAST_DURATION
      })
  });
  const [deleteBsdasri, { loading: deletingBsdasri }] = useMutation<
    Pick<Mutation, "deleteBsdasri">,
    MutationDeleteBsdasriArgs
  >(DELETE_BSDASRI, {
    variables: { id: bsdId },
    onCompleted: () => {
      toast.success(messageSuccess, { duration: TOAST_DURATION });
      !!onClose && onClose();
    },
    onError: () =>
      toast.error(messageError, {
        duration: TOAST_DURATION
      })
  });

  const [deleteBsdd, { loading: deletingBsdd }] = useMutation<
    Pick<Mutation, "deleteForm">,
    MutationDeleteFormArgs
  >(DELETE_FORM, {
    variables: { id: bsdId },
    onCompleted: () => {
      toast.success(messageSuccess, { duration: TOAST_DURATION });
      !!onClose && onClose();
    },
    onError: error =>
      toast.error(error.message, {
        duration: TOAST_DURATION
      })
  });

  const [deleteBsff, { loading: deletingBsff }] = useMutation<
    Pick<Mutation, "deleteBsff">,
    MutationDeleteBsffArgs
  >(DELETE_BSFF, {
    variables: { id: bsdId },
    onCompleted: () => {
      toast.success(messageSuccess, { duration: TOAST_DURATION });
      !!onClose && onClose();
    },
    onError: () =>
      toast.error(messageError, {
        duration: TOAST_DURATION
      })
  });

  const [deleteBsvhu, { loading: deletingBsvhu }] = useMutation<
    Pick<Mutation, "deleteBsvhu">,
    MutationDeleteBsvhuArgs
  >(DELETE_BSVHU, {
    variables: { id: bsdId },
    onCompleted: () => {
      toast.success(messageSuccess, { duration: TOAST_DURATION });
      !!onClose && onClose();
    },
    onError: () =>
      toast.error(messageError, {
        duration: TOAST_DURATION
      })
  });

  const [deleteBspaoh, { loading: deletingBspaoh }] = useMutation<
    Pick<Mutation, "deleteBspaoh">,
    MutationDeleteBspaohArgs
  >(DELETE_BSPAOH, {
    variables: { id: bsdId },
    onCompleted: () => {
      toast.success(messageSuccess, { duration: TOAST_DURATION });
      !!onClose && onClose();
    },
    onError: () =>
      toast.error(messageError, {
        duration: TOAST_DURATION
      })
  });

  const loading =
    deletingBsda ||
    deletingBsdasri ||
    deletingBsdd ||
    deletingBsff ||
    deletingBsvhu ||
    deletingBspaoh;

  const onDelete = () => {
    if (bsdType === BsdType.Bsdd) {
      deleteBsdd();
    }
    if (bsdType === BsdType.Bsda) {
      deleteBsda();
    }
    if (bsdType === BsdType.Bsdasri) {
      deleteBsdasri();
    }
    if (bsdType === BsdType.Bsff) {
      deleteBsff();
    }
    if (bsdType === BsdType.Bsvhu) {
      deleteBsvhu();
    }
    if (bsdType === BsdType.Bspaoh) {
      deleteBspaoh();
    }
  };

  return (
    <TdModal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Supprimer un bordereau"
      size="M"
    >
      <h2 className="td-modal-title">Confirmer la suppression ?</h2>
      <p>Cette action est irréversible.</p>
      <div className="td-modal-actions">
        <Button onClick={onClose} priority="secondary">
          Annuler
        </Button>
        <Button onClick={onDelete}>
          <IconTrash />
          <span> Supprimer</span>
        </Button>

        {loading && <Loader />}
      </div>
    </TdModal>
  );
}

export default DeleteModal;
