import React, { useState } from "react";
import { Modal } from "../../../common/components";
import { useMutation, useQuery } from "@apollo/client";
import {
  ACCEPT_MEMBERSHIP_REQUEST,
  REFUSE_MEMBERSHIP_REQUEST,
  MEMBERSHIP_REQUEST,
  MEMBERSHIP_REQUESTS,
  MY_COMPANIES
} from "../common/queries";
import { NotificationError } from "../../common/Components/Error/Error";
import { Loader } from "../../common/Components";
import {
  MembershipRequestStatus,
  Query,
  UserRole,
  Mutation
} from "@td/codegen-ui";
import { userRoleSwitchOptions } from "./CompanyMembersList";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { userRoleLabel } from "../common/utils";

type CompanyMembersRequestModalProps = {
  id: string;
  onClose: () => void;
};

export default function CompanyMembersRequestModal({
  id,
  onClose
}: CompanyMembersRequestModalProps) {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.Member);

  const {
    data: requestData,
    loading: requestLoading,
    error: requestError
  } = useQuery<Pick<Query, "membershipRequest">>(MEMBERSHIP_REQUEST, {
    variables: { id }
  });

  const [
    acceptMembershipRequest,
    { data: acceptData, loading: acceptLoading, error: acceptError }
  ] = useMutation<Pick<Mutation, "acceptMembershipRequest">>(
    ACCEPT_MEMBERSHIP_REQUEST,
    {
      refetchQueries: [MEMBERSHIP_REQUESTS, MY_COMPANIES]
    }
  );

  const [
    refuseMembershipRequest,
    { data: refuseData, loading: refuseLoading, error: refuseError }
  ] = useMutation<Pick<Mutation, "refuseMembershipRequest">>(
    REFUSE_MEMBERSHIP_REQUEST,
    {
      refetchQueries: [MEMBERSHIP_REQUESTS]
    }
  );

  const loading = acceptLoading || refuseLoading;

  const renderContent = () => {
    if (requestLoading) {
      return (
        <div>
          <Loader />
        </div>
      );
    }

    if (requestError) return <NotificationError apolloError={requestError} />;

    if (
      requestData &&
      requestData.membershipRequest?.status !== MembershipRequestStatus.Pending
    )
      return (
        <div>Cette demande de rattachement a déjà été acceptée ou refusée</div>
      );

    if (acceptData) {
      return (
        <div>
          L'utilisateur {requestData?.membershipRequest.name} a été rattaché à
          votre établissement en tant que {userRoleLabel(userRole)}.
        </div>
      );
    }

    if (refuseData) {
      return (
        <div>
          La demande de rattachement de l'utilisateur{" "}
          {requestData?.membershipRequest.name} a été refusée.
        </div>
      );
    }

    if (requestData && requestData.membershipRequest)
      return (
        <>
          <div>
            <div className="fr-table">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Nom</th>
                    <th scope="col">Courriel</th>
                    <th scope="col">Rôle</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{requestData.membershipRequest.name}</td>
                    <td>{requestData.membershipRequest.email}</td>
                    <td>
                      <Select
                        label=""
                        nativeSelectProps={{
                          value: userRole,
                          onChange: e => setUserRole(e.target.value as UserRole)
                        }}
                      >
                        {userRoleSwitchOptions()}
                      </Select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="td-modal-actions">
            <button
              className="fr-btn fr-btn--secondary"
              onClick={() =>
                refuseMembershipRequest({
                  variables: { id: requestData.membershipRequest.id }
                })
              }
              disabled={loading}
            >
              {refuseLoading ? "Chargement..." : "Refuser"}
            </button>
            <button
              className="fr-btn"
              onClick={() => {
                acceptMembershipRequest({
                  variables: {
                    id: requestData.membershipRequest.id,
                    role: userRole
                  }
                });
              }}
              disabled={loading}
            >
              {acceptLoading ? "Chargement..." : "Accepter"}
            </button>
          </div>
          {acceptError && <NotificationError apolloError={acceptError} />}
          {refuseError && <NotificationError apolloError={refuseError} />}
        </>
      );

    return null;
  };

  return (
    <Modal
      title="Demande de rattachement"
      ariaLabel="Demande de rattachement"
      onClose={onClose}
      closeLabel="Fermer"
      size="L"
      isOpen
    >
      {renderContent()}
    </Modal>
  );
}
