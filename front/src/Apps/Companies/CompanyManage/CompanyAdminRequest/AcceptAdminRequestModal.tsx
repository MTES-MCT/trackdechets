import React from "react";
import TdModal from "../../../common/Components/Modal/Modal";
import {
  QueryAdminRequestArgs,
  Query,
  Mutation,
  MutationAcceptAdminRequestArgs,
  MutationRefuseAdminRequestArgs
} from "@td/codegen-ui";
import { useMutation, useQuery } from "@apollo/client";
import {
  ACCEPT_ADMIN_REQUEST,
  ADMIN_REQUEST,
  REFUSE_ADMIN_REQUEST
} from "../../../common/queries/adminRequest/adminRequest";
import { useNavigate } from "react-router-dom";
import { InlineLoader } from "../../../common/Components/Loader/Loaders";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import toast from "react-hot-toast";

interface AcceptAdminRequestModalProps {
  adminRequestId: string;
}

export const AcceptAdminRequestModal = ({
  adminRequestId
}: AcceptAdminRequestModalProps) => {
  const navigate = useNavigate();

  const {
    data,
    loading: loadingGet,
    error: errorGet
  } = useQuery<Pick<Query, "adminRequest">, QueryAdminRequestArgs>(
    ADMIN_REQUEST,
    {
      variables: { adminRequestId }
    }
  );

  const [
    acceptAdminRequest,
    { loading: loadingAccept, error: errorAccept, reset: resetAccept }
  ] = useMutation<
    Pick<Mutation, "acceptAdminRequest">,
    MutationAcceptAdminRequestArgs
  >(ACCEPT_ADMIN_REQUEST);

  const [
    refuseAdminRequest,
    { loading: loadingRefuse, error: errorRefuse, reset: resetRefuse }
  ] = useMutation<
    Pick<Mutation, "refuseAdminRequest">,
    MutationRefuseAdminRequestArgs
  >(REFUSE_ADMIN_REQUEST);

  const adminRequest = data?.adminRequest;

  const onClose = () => {
    navigate("/companies/manage");
  };

  // TODO: si le statut n'est pas PENDING, afficher un message clair

  return (
    <TdModal
      onClose={onClose}
      title="Attribuer les droits administrateur"
      ariaLabel="Attribuer les droits administrateur"
      size="L"
      isOpen
    >
      {errorGet && (
        <Alert title="Erreur" description={errorGet.message} severity="error" />
      )}

      {loadingGet && <InlineLoader />}

      {!loadingGet && adminRequest && (
        <>
          <p className="fr-mb-4w">
            Acceptez-vous que l'utilisateur <b>{adminRequest.user.name}</b>{" "}
            devienne <b>ADMINISTRATEUR</b> de l'entreprise{" "}
            <b>
              {adminRequest.company.name} - {adminRequest.company.orgId}
            </b>{" "}
            ?
          </p>

          {errorAccept && (
            <Alert
              title="Erreur"
              description={errorAccept.message}
              severity="error"
            />
          )}
          {errorRefuse && (
            <Alert
              title="Erreur"
              description={errorRefuse.message}
              severity="error"
            />
          )}

          <div className="dsfr-modal-actions">
            <Button
              disabled={loadingAccept || loadingRefuse}
              priority="primary"
              onClick={() => {
                resetRefuse();
                resetAccept();

                acceptAdminRequest({
                  variables: { input: { adminRequestId } },
                  onCompleted: () => {
                    toast.success("Demande accordée");
                    onClose();
                  }
                });
              }}
              type="button"
            >
              Accepter
            </Button>

            <Button
              priority="secondary"
              type="submit"
              disabled={loadingAccept || loadingRefuse}
              onClick={() => {
                resetRefuse();
                resetAccept();

                refuseAdminRequest({
                  variables: { adminRequestId },
                  onCompleted: () => {
                    toast.success("Demande refusée");
                    onClose();
                  }
                });
              }}
            >
              Refuser
            </Button>
          </div>
        </>
      )}
    </TdModal>
  );
};
