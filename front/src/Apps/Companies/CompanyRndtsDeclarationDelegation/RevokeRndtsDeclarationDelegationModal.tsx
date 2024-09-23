import React from "react";
import {
  Mutation,
  MutationRevokeRndtsDeclarationDelegationArgs
} from "@td/codegen-ui";
import { Modal } from "../../../common/components";
import Button from "@codegouvfr/react-dsfr/Button";
import { useMutation } from "@apollo/client";
import { REVOKE_RNDTS_DECLARATION_DELEGATION } from "../../common/queries/rndtsDeclarationDelegation/queries";
import toast from "react-hot-toast";

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

export const RevokeRndtsDeclarationDelegationModal = ({
  delegationId,
  to,
  from,
  onClose
}: Props) => {
  const [revokeRndtsDeclarationDelegation, { loading }] = useMutation<
    Pick<Mutation, "revokeRndtsDeclarationDelegation">,
    MutationRevokeRndtsDeclarationDelegationArgs
  >(REVOKE_RNDTS_DECLARATION_DELEGATION);

  const onRevoke = async () => {
    await revokeRndtsDeclarationDelegation({
      variables: {
        delegationId
      },
      onCompleted: () => toast.success("Délégation révoquée!"),
      onError: err => toast.error(err.message)
    });

    // Delegation is automatically updated in Apollo's cache
    onClose();
  };

  const companyName = to ? `pour ${to}` : `de ${from}`;

  return (
    <Modal
      onClose={onClose}
      ariaLabel="Refuser la délégation"
      closeLabel="Ne pas refuser"
      size="M"
      isOpen
    >
      <div>
        <h4>
          <WarningIcon /> Refuser la délégation
        </h4>

        <p>
          Vouez-vous réellement refuser la délégation {companyName}? Vous ne
          pourrez pas la rétablir.
        </p>

        <div className="dsfr-modal-actions fr-mt-3w">
          <Button
            disabled={loading}
            priority="secondary"
            onClick={onRevoke}
            type="button"
          >
            Refuser
          </Button>
          <Button type="submit" disabled={loading} onClick={onClose}>
            Ne pas refuser
          </Button>
        </div>
      </div>
    </Modal>
  );
};
