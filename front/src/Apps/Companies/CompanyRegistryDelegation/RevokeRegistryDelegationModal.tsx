import React from "react";
import { Mutation, MutationRevokeRegistryDelegationArgs } from "@td/codegen-ui";
import { Modal } from "../../../common/components";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { REVOKE_REGISTRY_DELEGATION } from "../../common/queries/registryDelegation/queries";
import toast from "react-hot-toast";
import { isDefined } from "../../../common/helper";

const WarningIcon = () => (
  <span
    className="fr-icon-warning-line fr-icon--lg"
    style={{ color: "#b34000" }}
    aria-hidden="true"
  ></span>
);

interface Props {
  delegationId: string;
  to: string | null | undefined;
  from: string | null | undefined;
  onClose: () => void;
}

export const RevokeRegistryDelegationModal = ({
  delegationId,
  to,
  from,
  onClose
}: Props) => {
  const [revokeRegistryDelegation, { loading }] = useMutation<
    Pick<Mutation, "revokeRegistryDelegation">,
    MutationRevokeRegistryDelegationArgs
  >(REVOKE_REGISTRY_DELEGATION);

  const onRevoke = async () => {
    await revokeRegistryDelegation({
      variables: {
        delegationId
      },
      onCompleted: () => toast.success("Délégation révoquée!"),
      onError: err => toast.error(err.message)
    });

    // Delegation is automatically updated in Apollo's cache
    onClose();
  };

  // Wording changes if delegator or delegate
  let title = "Révoquer la délégation";
  let content = `Vous vous apprêtez à révoquer la délégation pour ${to}.`;
  let acceptLabel = "Révoquer";
  let refuseLabel = "Ne pas révoquer";
  let closeModalLabel = "Ne pas révoquer";

  if (isDefined(from)) {
    title = "Annuler la délégation";
    content = `Vous vous apprêtez à annuler la délégation de ${from}.`;
    acceptLabel = "Annuler";
    refuseLabel = "Ne pas annuler";
    closeModalLabel = "Ne pas annuler";
  }

  return (
    <Modal
      onClose={onClose}
      ariaLabel={title}
      closeLabel={closeModalLabel}
      size="M"
      isOpen
    >
      <div>
        <h4>
          <WarningIcon /> {title}
        </h4>

        <p>{content}</p>

        <div className="dsfr-modal-actions fr-mt-3w">
          <Button
            disabled={loading}
            priority="secondary"
            onClick={onRevoke}
            type="button"
          >
            {acceptLabel}
          </Button>
          <Button type="submit" disabled={loading} onClick={onClose}>
            {refuseLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};