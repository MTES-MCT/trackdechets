import React, { useState } from "react";

import { COLORS } from "common/config";
import { CommonFileRemove } from "common/components/Icons";
import mutations from "./slip-actions.mutations";
import { useMutation } from "@apollo/react-hooks";
import { Mutation, MutationCancelFormArgs } from "generated/graphql/types";
import cogoToast from "cogo-toast";
import TdModal from "common/components/Modal";

type Props = {
  formId: string;
  small?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

export default function Cancel({
  formId,
  small = true,
  onOpen,
  onClose,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [cancelForm] = useMutation<
    Pick<Mutation, "cancelForm">,
    MutationCancelFormArgs
  >(mutations.CANCEL_FORM, {
    variables: { id: formId },
    onCompleted: () => {
      cogoToast.success("Bordereau annulé", { hideAfter: 5 });
      setIsOpen(false);
    },
    onError: () =>
      cogoToast.error("Le bordereau n'a pas pu être annulé", {
        hideAfter: 5,
      }),
  });
  const className = small
    ? "btn--no-style slips-actions__button"
    : "btn btn--outline-primary";

  return (
    <>
      <button
        className={className}
        title="Annuler"
        onClick={() => {
          setIsOpen(true);
          onOpen && onOpen();
        }}
      >
        <CommonFileRemove color={COLORS.blueLight} />
        <span>Annuler</span>
      </button>
      <TdModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          !!onClose && onClose();
        }}
        ariaLabel="Annuler la collecte"
      >
        <h2 className="td-modal-title">
          Confirmer l'annulation de la collecte?
        </h2>
        <p>Le bordereau sera toujours visible depuis l'onglet Archives</p>
        <div className="td-modal-actions">
          <button
            className="btn btn--outline-primary"
            onClick={() => setIsOpen(false)}
          >
            Retour
          </button>
          <button className="btn btn--primary" onClick={() => cancelForm()}>
            <CommonFileRemove />
            <span>Annuler</span>
          </button>
        </div>
      </TdModal>
    </>
  );
}
