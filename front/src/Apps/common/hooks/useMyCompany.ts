import { useQuery } from "@apollo/client";
import { Query } from "@td/codegen-ui";
import gql from "graphql-tag";
import { CompanyDetailsfragment } from "../../Companies/common/fragments";

const MY_COMPANIES = gql`
  query MyCompanies($orgId: String!) {
    myCompanies(first: 1, search: $orgId) {
      edges {
        cursor
        node {
          ...CompanyDetailsFragment
        }
      }
    }
  }
  ${CompanyDetailsfragment.company}
`;

export function useMyCompany(orgId: string | undefined) {
  const { data, loading, error, refetch } = useQuery<
    Pick<Query, "myCompanies">
  >(MY_COMPANIES, {
    variables: { orgId },
    skip: !orgId
  });

  const company = data?.myCompanies.edges[0]?.node;

  const reloadCompany = () => {
    refetch({ orgId });
  };

  return {
    company,
    loading,
    error,
    reloadCompany
  };
}
