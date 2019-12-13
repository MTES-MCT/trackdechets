import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import { Company, CompanyUser } from "./AccountCompany";
import AccountCompanyInviteNewUser from "./AccountCompanyInviteNewUser";
import AccountCompanyMember from "./AccountCompanyMember";

type Props = { company: Company };

AccountCompanyMemberList.fragments = {
  company: gql`
    fragment AccountCompanyMemberListFragment on CompanyPrivate {
      ...AccountCompanyInviteNewUserFragment
      users {
        ...AccountCompanyMemberFragment
      }
    }
    ${AccountCompanyInviteNewUser.fragments.company}
    ${AccountCompanyMember.fragments.user}
  `
};

export default function AccountCompanyMemberList({ company }: Props) {
  return (
    <>
      <AccountCompanyInviteNewUser
        company={filter(AccountCompanyInviteNewUser.fragments.company, company)}
      />
      <table className="table">
        <tbody>
          {company.users.map((user: CompanyUser) => (
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
