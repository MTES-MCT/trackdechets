import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import { Company, CompanyMember } from "./AccountCompany";
import AccountFormCompanyInviteNewUser from "./fields/forms/AccountFormCompanyInviteNewUser";
import AccountCompanyMember from "./AccountCompanyMember";

type Props = { company: Company };

AccountCompanyMemberList.fragments = {
  company: gql`
    fragment AccountCompanyMemberListFragment on CompanyPrivate {
      ...AccountFormCompanyInviteNewUserFragment
      users {
        ...AccountCompanyMemberFragment
      }
    }
    ${AccountFormCompanyInviteNewUser.fragments.company}
    ${AccountCompanyMember.fragments.user}
  `
};

export default function AccountCompanyMemberList({ company }: Props) {
  return (
    <>
      <AccountFormCompanyInviteNewUser
        company={filter(
          AccountFormCompanyInviteNewUser.fragments.company,
          company
        )}
      />
      <table className="table">
        <tbody>
          {company.users.map((user: CompanyMember) => (
            <AccountCompanyMember
              key={user.id}
              user={filter(AccountCompanyMember.fragments.user, user)}
            />
          ))}
        </tbody>
      </table>
    </>
  );
}
