import { useMutation } from "@apollo/client";
import {
  AdministrativeTransfer,
  CompanyPrivate,
  Mutation,
  MutationSubmitAdministrativeTransferApprovalArgs
} from "@td/codegen-ui";
import React, { useState } from "react";
import { SUBMIT_ADMINISTRATIVE_TRANSFER_APPROVAL } from "../common/queries";
import { NotificationError } from "../../common/Components/Error/Error";
import Button from "@codegouvfr/react-dsfr/Button";
import Modal from "../../common/Components/Modal/Modal";

type Props = {
  company: CompanyPrivate;
};

export function ApproveAdministrativeTransfer({ company }: Props) {
  const administrativeTranfer = company.receivedAdministrativeTransfers?.[0];
  const [isModalOpened, setIsModalOpened] = useState<boolean>(false);

  const [
    submitAdministrativeTransferApproval,
    { loading: loadingApprove, error: errorApprove }
  ] = useMutation<
    Pick<Mutation, "submitAdministrativeTransferApproval">,
    MutationSubmitAdministrativeTransferApprovalArgs
  >(SUBMIT_ADMINISTRATIVE_TRANSFER_APPROVAL, {
    update(cache) {
      cache.modify({
        id: `CompanyPrivate:${company.id}`,
        fields: {
          receivedAdministrativeTransfers() {
            return [] as AdministrativeTransfer[];
          }
        }
      });
    }
  });

  if (!administrativeTranfer) {
    return null;
  }

  return (
    <div className="company-advanced__section">
      <h4 className="company-advanced__title">
        Réception d'un transfert administratif de bordereau
      </h4>
      <p className="company-advanced__description">
        Vous vous apprêtez à valider la modification des BSDs sur lesquels
        l'établissement {administrativeTranfer.from.name} -{" "}
        {administrativeTranfer.from.orgId} était destinataire (statut reçu, ou
        en traitement intermédiaire) pour les affecter au nouveau SIRET de votre
        établissement.
      </p>
      <p className="company-advanced__description">
        Attention, cette action est définitive.
      </p>

      <div>
        <Button
          size="small"
          onClick={() =>
            submitAdministrativeTransferApproval({
              variables: {
                input: { id: administrativeTranfer.id, isApproved: false }
              }
            })
          }
          disabled={loadingApprove}
          className="tw-mr-2"
          priority="secondary"
        >
          Refuser le transfert
        </Button>
        <Button
          size="small"
          onClick={() => setIsModalOpened(true)}
          disabled={loadingApprove}
          className="tw-mr-2"
        >
          Valider le transfert
        </Button>
      </div>

      <Modal
        ariaLabel="Suppression de l'établissement"
        onClose={() => setIsModalOpened(false)}
        isOpen={isModalOpened}
      >
        <h4 className="company-advanced__modal-title">Valider le transfert</h4>

        <p className="company-advanced__modal-description">
          Êtes vous sûr de vouloir valider le transfert des BSDs sur lesquels
          l'établissement {administrativeTranfer.from.name} -{" "}
          {administrativeTranfer.from.orgId} était destinataire pour les
          affecter à votre établissement ?
        </p>

        {errorApprove && <NotificationError apolloError={errorApprove} />}

        <div className="company-advanced__modal-cta">
          <Button
            size="small"
            onClick={async () => {
              await submitAdministrativeTransferApproval({
                variables: {
                  input: { id: administrativeTranfer.id, isApproved: true }
                }
              });
              setIsModalOpened(false);
            }}
            disabled={loadingApprove}
            iconId="fr-icon-success-line"
            iconPosition="left"
            priority="secondary"
          >
            {loadingApprove ? "Validation..." : "Valider"}
          </Button>
          <Button
            size="small"
            onClick={() => setIsModalOpened(false)}
            disabled={loadingApprove}
            iconId="fr-icon-error-line"
            iconPosition="left"
          >
            Ne pas valider
          </Button>
        </div>
      </Modal>
    </div>
  );
}
