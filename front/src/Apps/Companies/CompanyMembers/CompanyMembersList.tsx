import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  CompanyPrivate,
  UserRole,
  Mutation,
  MutationRemoveUserFromCompanyArgs,
  MutationDeleteInvitationArgs,
  CompanyMember,
  MutationResendInvitationArgs
} from "@td/codegen-ui";
import {
  REMOVE_USER_FROM_COMPANY,
  DELETE_INVITATION,
  RESEND_INVITATION
} from "../common/queries";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Input } from "@codegouvfr/react-dsfr/Input";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";

import "./companyMembers.scss";

interface CompanyMembersListProps {
  company: CompanyPrivate;
}

const deleteModal = createModal({
  id: "user-delete-modal",
  isOpenedByDefault: false
});

const userRoleLabel = role => {
  switch (role) {
    case UserRole.Admin:
      return "Administrateur";
    case UserRole.Member:
      return "Collaborateur";
    case UserRole.Driver:
      return "Chauffeur";
    case UserRole.Reader:
      return "Lecteur";
  }
};

export const userRoleSwitchOptions = () => {
  return Object.keys(UserRole).map(role => (
    <option key={UserRole[role]} value={UserRole[role]}>
      {userRoleLabel(UserRole[role])}
    </option>
  ));
};

const CompanyMembersList = ({ company }: CompanyMembersListProps) => {
  const [memberToDelete, setMemberToDelete] = useState<CompanyMember | null>(
    null
  );
  const [filteredMembers, setFilteredMembers] = useState<
    CompanyMember[] | null
  >(null);

  const isAdmin = company.userRole === UserRole.Admin;

  const [removeUserFromCompany] = useMutation<
    Pick<Mutation, "removeUserFromCompany">,
    MutationRemoveUserFromCompanyArgs
  >(REMOVE_USER_FROM_COMPANY, {
    onCompleted: () => {
      toast.success("Utilisateur révoqué", { duration: TOAST_DURATION });
      setMemberToDelete(null);
    },
    onError: () => {
      toast.error(
        "L'utilisateur n'a pas pu être révoqué. Veuillez réessayer dans quelques minutes.",
        {
          duration: TOAST_DURATION
        }
      );
      setMemberToDelete(null);
    }
  });

  const [deleteInvitation] = useMutation<
    Pick<Mutation, "deleteInvitation">,
    MutationDeleteInvitationArgs
  >(DELETE_INVITATION, {
    onCompleted: () => {
      toast.success("Invitation supprimée", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error("L'invitation n'a pas pu être supprimée", {
        duration: TOAST_DURATION
      });
    }
  });

  const [resendInvitation] = useMutation<
    Pick<Mutation, "resendInvitation">,
    MutationResendInvitationArgs
  >(RESEND_INVITATION, {
    onCompleted: () => {
      toast.success("Invitation renvoyée", { duration: TOAST_DURATION });
    },
    onError: () => {
      toast.error(
        "L'invitation n'a pas pu être renvoyée. Veuillez réessayer dans quelques minutes.",
        {
          duration: TOAST_DURATION
        }
      );
    }
  });

  const onClickRemoveUser = user => {
    setMemberToDelete(user);
    deleteModal.open();
  };

  const onClickCancelInvitation = user => {
    deleteInvitation({
      variables: { email: user.email, siret: company.orgId! }
    });
  };

  const onClickResendInvitation = user => {
    resendInvitation({
      variables: { email: user.email, siret: company.orgId }
    });
  };

  const onFilterMembers = predicate => {
    if (predicate.length === 0) {
      setFilteredMembers(null);
      return;
    }

    function filterUsers(users: CompanyMember[], filterString: string) {
      return users.filter(
        user =>
          user.name?.toLowerCase().includes(filterString.toLowerCase()) ||
          user.email.toLowerCase().includes(filterString.toLowerCase())
      );
    }

    if (company?.users?.length && company?.users?.length > 0) {
      setFilteredMembers(filterUsers(company.users, predicate));
    }
  };

  return (
    <div className="company-members__list">
      {company && company.users && company.users.length > 0 && (
        <>
          <h4 className="fr-h4">Gérer les membres</h4>
          <div className={`fr-container--fluid`}>
            <div
              className={`fr-grid-row fr-grid-row--gutters fr-grid-row--bottom`}
            >
              <div className="fr-col-12 fr-col-lg-4">
                <Input
                  label="Filtrer"
                  nativeInputProps={{
                    type: "text",
                    onChange: e => {
                      onFilterMembers(e.target.value);
                    }
                  }}
                />
              </div>
              <div className="fr-col-12 fr-col-lg-6 fr-pb-2w">
                <b>
                  {filteredMembers !== null
                    ? `${filteredMembers.length} membres affichés (${company.users.length} total)`
                    : `${company.users.length} membres`}
                </b>
              </div>
            </div>
          </div>

          <div className="fr-table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Nom</th>
                  <th scope="col">Email</th>
                  <th scope="col">Rôle</th>
                  <th scope="col">Statut</th>
                  {isAdmin && <th scope="col">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(filteredMembers !== null
                  ? filteredMembers
                  : company.users
                ).map(user => (
                  <tr key={user.id}>
                    <td>
                      {user.name} {user.isMe && <span>(vous)</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {isAdmin ? (
                        <Select
                          label=""
                          disabled={true}
                          nativeSelectProps={{
                            value: user.role!,
                            ...{ "data-testid": "company-member-role" }
                          }}
                        >
                          {userRoleSwitchOptions()}
                        </Select>
                      ) : (
                        userRoleLabel(user.role)
                      )}
                    </td>
                    <td>
                      {user.isPendingInvitation
                        ? "Invitation en attente"
                        : user.isActive
                        ? "Utilisateur actif"
                        : "Email non confirmé"}
                    </td>
                    {isAdmin && (
                      <td>
                        {!user.isPendingInvitation && !user.isMe && (
                          <button
                            className="fr-btn fr-btn--secondary fr-icon-logout-box-r-line"
                            onClick={() => onClickRemoveUser(user)}
                          >
                            Révoquer l'utilisateur
                          </button>
                        )}
                        {user.isPendingInvitation && !user.isMe && (
                          <>
                            <button
                              className="fr-btn fr-btn--secondary fr-icon-mail-line"
                              onClick={() => onClickResendInvitation(user)}
                            >
                              Renvoyer l'invitation
                            </button>
                            <button
                              className="fr-btn fr-btn--secondary fr-icon-delete-line"
                              onClick={() => onClickCancelInvitation(user)}
                            >
                              Supprimer l'invitation
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {isAdmin && (
        <deleteModal.Component
          title={`Révoquer ${memberToDelete ? memberToDelete.name : ""}`}
          iconId="fr-icon-warning-line"
          buttons={[
            {
              onClick: () => {
                setMemberToDelete(null);
              },
              children: "Ne pas révoquer"
            },
            {
              iconId: "ri-check-line",
              nativeButtonProps: {
                "data-testid": "member-delete-modal-button"
              },
              onClick: () => {
                if (memberToDelete !== null) {
                  removeUserFromCompany({
                    variables: {
                      siret: company.orgId!,
                      userId: memberToDelete.id
                    }
                  });
                }
              },
              children: "Révoquer"
            }
          ]}
        >
          Êtes-vous sûr de vouloir révoquer{" "}
          {memberToDelete ? memberToDelete.name : ""} ?
        </deleteModal.Component>
      )}
    </div>
  );
};

export default CompanyMembersList;
