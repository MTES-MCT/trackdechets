import React from "react";
import { gql } from "@apollo/client";
import AccountFormCompanyInviteNewUser from "./fields/forms/AccountFormCompanyInviteNewUser";
import AccountCompanyMember from "./AccountCompanyMember";
import {
  CompanyPrivate,
  CompanyVerificationStatus,
  UserRole
} from "@td/codegen-ui";
import * as COMPANY_CONSTANTS from "@td/constants";

const { VITE_VERIFY_COMPANY } = import.meta.env;

type Props = { company: CompanyPrivate };

AccountCompanyMemberList.fragments = {
  company: gql`
    fragment AccountCompanyMemberListFragment on CompanyPrivate {
      ...AccountCompanyMemberCompanyFragment
      ...AccountFormCompanyInviteNewUserFragment
      companyTypes
      verificationStatus
      users {
        ...AccountCompanyMemberUserFragment
      }
    }
    ${AccountFormCompanyInviteNewUser.fragments.company}
    ${AccountCompanyMember.fragments.company}
    ${AccountCompanyMember.fragments.user}
  `
};

export default function AccountCompanyMemberList({ company }: Props) {
  const isProfessional = company.companyTypes.some(ct =>
    COMPANY_CONSTANTS.PROFESSIONALS.includes(ct)
  );

  const isAdmin = company.userRole === UserRole.Admin;

  const isVerified =
    company.verificationStatus === CompanyVerificationStatus.Verified;

  return (
    <>
      {isAdmin &&
        (VITE_VERIFY_COMPANY !== "true" ||
        !isProfessional ||
        (isProfessional && isVerified) ? (
          <AccountFormCompanyInviteNewUser company={company} />
        ) : (
          <div className="notification">
            Vous ne pouvez pas inviter de nouveaux membres car l'établissement
            n'a pas encore été vérifié
          </div>
        ))}

      {company && company.users && company.users.length > 0 && (
        <table className="td-table">
          <tbody>
            {company.users.map(user => (
              <AccountCompanyMember
                key={user.id}
                company={company}
                user={user}
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
