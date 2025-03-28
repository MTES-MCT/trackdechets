import React, { useMemo, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  UserRole,
  Mutation,
  MutationRemoveUserFromCompanyArgs,
  MutationDeleteInvitationArgs,
  CompanyMember,
  MutationResendInvitationArgs,
  MutationChangeUserRoleArgs,
  Query
} from "@td/codegen-ui";
import {
  REMOVE_USER_FROM_COMPANY,
  DELETE_INVITATION,
  RESEND_INVITATION,
  CHANGE_USER_ROLE
} from "../common/queries";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Input } from "@codegouvfr/react-dsfr/Input";
import toast from "react-hot-toast";
import { TOAST_DURATION } from "../../../common/config";

import "./companyMembers.scss";
import { CompanyPrivateMembers } from "./CompanyMembers";
import { userRoleLabel } from "../common/utils";
import { useParams } from "react-router-dom";
import { AcceptAdminRequestModal } from "./AcceptAdminRequestModal";

interface CompanyMembersListProps {
  company: CompanyPrivateMembers;
  isTDAdmin: boolean;
}

const deleteModal = createModal({
  id: "user-delete-modal",
  isOpenedByDefault: false
});

export const userRoleSwitchOptions = () => {
  return Object.keys(UserRole).map(role => (
    <option key={role} value={UserRole[role]}>
      {userRoleLabel(UserRole[role])}
    </option>
  ));
};

const CompanyMembersList = ({
  company,
  isTDAdmin = false
}: CompanyMembersListProps) => {
  const [memberToDelete, setMemberToDelete] = useState<CompanyMember | null>(
    null
  );
  const [filter, setFilter] = useState<string>("");
  const { adminRequestId } = useParams<{ adminRequestId: string }>();

  const isAdmin = company.userRole === UserRole.Admin || isTDAdmin;

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
    },
    updateQueries: {
      CompanyPrivateInfos: (
        prev: Pick<Query, "companyPrivateInfos">,
        { mutationResult }
      ) => {
        return {
          companyPrivateInfos: {
            ...prev,
            users: mutationResult.data?.removeUserFromCompany.users ?? []
          }
        };
      }
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
    },
    updateQueries: {
      CompanyPrivateInfos: (
        prev: Pick<Query, "companyPrivateInfos">,
        { mutationResult }
      ) => {
        return {
          companyPrivateInfos: {
            ...prev,
            users: mutationResult.data?.deleteInvitation.users ?? []
          }
        };
      }
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

  const [changeUserRole] = useMutation<
    Pick<Mutation, "changeUserRole">,
    MutationChangeUserRoleArgs
  >(CHANGE_USER_ROLE, {
    onError: () => {
      toast.error("Le rôle de l'utilisateur n'a pas pu être modifié", {
        duration: TOAST_DURATION
      });
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

  const onUserRoleChange = (user: CompanyMember, role: UserRole) => {
    changeUserRole({
      variables: {
        userId: user.id,
        orgId: company.orgId,
        role
      }
    });
  };

  const filteredMembers = useMemo(() => {
    if (filter.length === 0 || !company?.users?.length) {
      return null;
    }
    return company.users.filter(
      user =>
        user.name?.toLowerCase().includes(filter.toLowerCase()) ||
        user.email.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter, company]);

  return (
    <div className="company-members__list">
      {company && company.users && company.users.length > 0 && (
        <>
          <h3 className="fr-h4">Gérer les membres</h3>
          <div className={`fr-container--fluid`}>
            <div
              className={`fr-grid-row fr-grid-row--gutters fr-grid-row--bottom`}
            >
              <div className="fr-col-12 fr-col-lg-4">
                <Input
                  label="Filtrer"
                  nativeInputProps={{
                    type: "text",
                    value: filter,
                    onChange: e => {
                      setFilter(e.target.value);
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
                          disabled={!!user.isMe}
                          nativeSelectProps={{
                            value: user.role!,
                            onChange: event => {
                              onUserRoleChange(
                                user,
                                event.target.value as UserRole
                              );
                            },
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
                              className="fr-btn fr-btn--secondary fr-icon-mail-line fr-mr-1w"
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

      {adminRequestId && (
        <AcceptAdminRequestModal adminRequestId={adminRequestId} />
      )}
    </div>
  );
};

export default CompanyMembersList;
