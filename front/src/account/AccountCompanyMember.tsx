import React from "react";
import { gql, useMutation } from "@apollo/client";
import {
  IconTrash,
  IconEmailActionUnread
} from "../Apps/common/Components/Icons/Icons";
import styles from "./AccountCompanyMember.module.scss";
import toast from "react-hot-toast";
import {
  CompanyPrivate,
  CompanyMember,
  UserRole,
  Mutation,
  MutationRemoveUserFromCompanyArgs,
  MutationDeleteInvitationArgs
} from "@td/codegen-ui";
import { TOAST_DURATION } from "../common/config";

type Props = {
  company: CompanyPrivate;
  user: CompanyMember;
};

AccountCompanyMember.fragments = {
  company: gql`
    fragment AccountCompanyMemberCompanyFragment on CompanyPrivate {
      orgId
      vatNumber
      siret
    }
  `,
  user: gql`
    fragment AccountCompanyMemberUserFragment on CompanyMember {
      id
      isMe
      email
      name
      role
      isActive
      isPendingInvitation
    }
  `
};

const REMOVE_USER_FROM_COMPANY = gql`
  mutation RemoveUserFromCompany($userId: ID!, $siret: String!) {
    removeUserFromCompany(userId: $userId, siret: $siret) {
      id
      users {
        ...AccountCompanyMemberUserFragment
      }
    }
  }
  ${AccountCompanyMember.fragments.user}
`;

const DELETE_INVITATION = gql`
  mutation DeleteInvitation($email: String!, $siret: String!) {
    deleteInvitation(email: $email, siret: $siret) {
      id
      users {
        ...AccountCompanyMemberUserFragment
      }
    }
  }
  ${AccountCompanyMember.fragments.user}
`;

const RESEND_INVITATION = gql`
  mutation ResendInvitation($email: String!, $siret: String!) {
    resendInvitation(email: $email, siret: $siret)
  }
`;

export default function AccountCompanyMember({ company, user }: Props) {
  const [removeUserFromCompany] = useMutation<
    Pick<Mutation, "removeUserFromCompany">,
    MutationRemoveUserFromCompanyArgs
  >(REMOVE_USER_FROM_COMPANY);
  const [deleteInvitation, { loading: deleteLoading }] = useMutation<
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
  const [resendInvitation, { loading: resendLoading }] = useMutation(
    RESEND_INVITATION,
    {
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
    }
  );
  return (
    <tr key={user.id}>
      <td>
        {user.name} {user.isMe && <span>(vous)</span>}
      </td>
      <td>{user.email}</td>
      <td>
        {user.role === UserRole.Admin ? "Administrateur" : "Collaborateur"}
      </td>
      <td>
        {user.isPendingInvitation
          ? "Invitation en attente"
          : user.isActive
          ? "Utilisateur actif"
          : "Email non confirmé"}
      </td>
      {!user.isMe && !user.isPendingInvitation && (
        <td className={styles["right-column"]}>
          <button
            className="btn btn--primary"
            onClick={() => {
              removeUserFromCompany({
                variables: { siret: company.orgId!, userId: user.id }
              });
            }}
          >
            <IconTrash /> Retirer les droits
          </button>
        </td>
      )}
      {user.isPendingInvitation && (
        <>
          <td className={styles["right-column"]}>
            <button
              className="btn btn--primary"
              disabled={deleteLoading}
              onClick={() => {
                deleteInvitation({
                  variables: { email: user.email, siret: company.orgId! }
                });
              }}
            >
              <IconTrash />{" "}
              {deleteLoading
                ? "Suppression en cours"
                : "Supprimer l'invitation"}
            </button>
          </td>
          <td className={styles["right-column"]}>
            <button
              className="btn btn--primary"
              disabled={resendLoading}
              onClick={() => {
                resendInvitation({
                  variables: { email: user.email, siret: company.orgId }
                });
              }}
            >
              <IconEmailActionUnread />{" "}
              {resendLoading ? "Envoi en cours" : "Renvoyer l'invitation"}
            </button>
          </td>
        </>
      )}
    </tr>
  );
}
