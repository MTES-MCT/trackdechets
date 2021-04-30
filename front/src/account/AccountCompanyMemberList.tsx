import React from "react";
import { gql } from "@apollo/client";
import { filter } from "graphql-anywhere";
import AccountFormCompanyInviteNewUser from "./fields/forms/AccountFormCompanyInviteNewUser";
import AccountCompanyMember from "./AccountCompanyMember";
import {
  CompanyPrivate,
  CompanyVerificationStatus,
} from "generated/graphql/types";
import * as COMPANY_TYPES from "generated/constants/COMPANY_TYPES";

const { REACT_APP_VERIFY_COMPANY } = process.env;

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
  `,
};

export default function AccountCompanyMemberList({ company }: Props) {
  const isProfessional = company.companyTypes.some(ct =>
    COMPANY_TYPES.PROFESSIONALS.includes(ct)
  );

  const isVerified =
    company.verificationStatus === CompanyVerificationStatus.Verified;

  return (
    <>
      {REACT_APP_VERIFY_COMPANY !== "true" ||
      !isProfessional ||
      (isProfessional && isVerified) ? (
        <AccountFormCompanyInviteNewUser
          company={filter(
            AccountFormCompanyInviteNewUser.fragments.company,
            company
          )}
        />
      ) : (
        <div className="notification">
          Vous ne pouvez pas inviter de nouveaux membres car l'établissement n'a
          pas encore été vérifié
        </div>
      )}

      {company && company.users && company.users.length > 0 && (
        <table className="td-table">
          <tbody>
            {company.users.map(user => (
              <AccountCompanyMember
                key={user.id}
                company={filter(
                  AccountCompanyMember.fragments.company,
                  company
                )}
                user={filter(AccountCompanyMember.fragments.user, user)}
              />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
