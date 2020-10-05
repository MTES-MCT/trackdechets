import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import AccountFormCompanyInviteNewUser from "./fields/forms/AccountFormCompanyInviteNewUser";
import AccountCompanyMember from "./AccountCompanyMember";
import { CompanyPrivate } from "src/generated/graphql/types";

type Props = { company: CompanyPrivate };

AccountCompanyMemberList.fragments = {
  company: gql`
    fragment AccountCompanyMemberListFragment on CompanyPrivate {
      ...AccountCompanyMemberCompanyFragment
      ...AccountFormCompanyInviteNewUserFragment
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
  return (
    <>
      <AccountFormCompanyInviteNewUser
        company={filter(
          AccountFormCompanyInviteNewUser.fragments.company,
          company
        )}
      />
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
