import React from "react";
import { gql } from "@apollo/client";
import { FaTimes, FaEnvelope } from "react-icons/fa";
import styles from "./AccountCompanyMember.module.scss";
import { useMutation } from "@apollo/client";
import cogoToast from "cogo-toast";
import {
  CompanyPrivate,
  CompanyMember,
  UserRole,
  Mutation,
  MutationRemoveUserFromCompanyArgs,
  MutationDeleteInvitationArgs,
} from "generated/graphql/types";

type Props = {
  company: CompanyPrivate;
  user: CompanyMember;
};

AccountCompanyMember.fragments = {
  company: gql`
    fragment AccountCompanyMemberCompanyFragment on CompanyPrivate {
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
  `,
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
  const [deleteInvitation] = useMutation<
    Pick<Mutation, "deleteInvitation">,
    MutationDeleteInvitationArgs
  >(DELETE_INVITATION, {
    onCompleted: () => {
      cogoToast.success("Invitation supprimée", { hideAfter: 5 });
    },
    onError: () => {
      cogoToast.error("L'invitation n'a pas pu être supprimée", {
        hideAfter: 5,
      });
    },
  });
  const [resendInvitation] = useMutation(RESEND_INVITATION, {
    onCompleted: () => {
      cogoToast.success("Invitation renvoyée", { hideAfter: 5 });
    },
    onError: () => {
      cogoToast.error("L'invitation n'a pas pu être renvoyée", {
        hideAfter: 5,
      });
    },
  });
  return (
    <>
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
                  variables: { siret: company.siret, userId: user.id },
                });
              }}
            >
              <FaTimes /> Retirer les droits
            </button>
          </td>
        )}
        {user.isPendingInvitation && (
          <>
            <td className={styles["right-column"]}>
              <button
                className="btn btn--primary"
                onClick={() => {
                  deleteInvitation({
                    variables: { email: user.email, siret: company.siret },
                  });
                }}
              >
                <FaTimes /> Supprimer l'invitation
              </button>
            </td>
            <td className={styles["right-column"]}>
              <button
                className="btn btn--primary"
                onClick={() => {
                  resendInvitation({
                    variables: { email: user.email, siret: company.siret },
                  });
                }}
              >
                <FaEnvelope /> Renvoyer l'invitation
              </button>
            </td>
          </>
        )}
      </tr>
    </>
  );
}
