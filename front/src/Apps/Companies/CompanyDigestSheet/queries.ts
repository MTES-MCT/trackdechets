import { gql } from "@apollo/client";
export const COMPANY_DIGEST = gql`
  query CompanyDigests($orgId: String!) {
    companyDigests(orgId: $orgId) {
      id
      createdAt
      updatedAt
      year
      orgId
      distantId
      state
    }
  }
`;
export const CREATE_COMPANY_DIGEST = gql`
  mutation CreateCompanyDigest($input: CompanyDigestCreateInput!) {
    createCompanyDigest(input: $input) {
      id
      createdAt
      updatedAt
      year
      orgId
      distantId
      state
    }
  }
`;
export const COMPANY_DIGEST_PDF = gql`
  query CompanyDigestPdf($id: ID!) {
    companyDigestPdf(id: $id) {
      downloadLink
      token
    }
  }
`;
