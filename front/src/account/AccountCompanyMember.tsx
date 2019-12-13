import React from "react";
import gql from "graphql-tag";
import { FaTimes } from "react-icons/fa";
import { CompanyUser, UserRole } from "./AccountCompany";
import styles from "./AccountCompanyMember.module.scss";

type Props = {
  user: CompanyUser;
};

AccountCompanyMember.fragments = {
  user: gql`
    fragment AccountCompanyMemberFragment on CompanyUser {
      id
      email
      name
      role
      isActive
      isPendingInvitation
    }
  `
};

export default function AccountCompanyMember({ user }: Props) {
  return (
    <>
      <tr key={user.id}>
        <td>{user.name}</td>
        <td>{user.email}</td>
        <td>
          {user.role == UserRole.ADMIN ? "Administrateur" : "Collaborateur"}
        </td>
        <td>
          {user.isPendingInvitation
            ? "Invitation en attente"
            : user.isActive
            ? "Utilisateur actif"
            : "Email non confirmé"}
        </td>
        <td className={styles["right-column"]}>
          <button className="button " onClick={() => {}}>
            <FaTimes /> Retirer les droits
          </button>
        </td>
      </tr>
    </>
  );
}
