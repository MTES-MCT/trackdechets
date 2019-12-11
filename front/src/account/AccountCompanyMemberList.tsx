import React from "react";
import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { Company } from "./AccountCompany";
import Loader from "../common/Loader";
import Error from "../common/Error";
import AccountCompanyMember, { User } from "./AccountCompanyMember";

type Props = { company: Company };

AccountCompanyMemberList.fragments = {
  company: gql`
    fragment AccountCompanyMemberListFragment on Company {
      siret
    }
  `
};

const GET_COMPANY_USERS = gql`
  query CompanyUsers($siret: String!) {
    companyUsers(siret: $siret) {
      id
      name
      email
      role
    }
  }
`;

export default function AccountCompanyMemberList({ company }: Props) {
  const { loading, error, data } = useQuery(GET_COMPANY_USERS, {
    variables: { siret: company.siret }
  });

  if (error) {
    return <Error message={error.message} />;
  }

  if (loading) {
    return <Loader />;
  }

  const { companyUsers } = data;

  return (
    <>
      <table className="table">
        <tbody>
          {data.companyUsers.map((user: User) => (
            <AccountCompanyMember user={user} />
          ))}
        </tbody>
      </table>
    </>
  );
}
