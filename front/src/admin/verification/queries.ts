import { gql } from "@apollo/client";

export const COMPANIES_FOR_VERIFICATION = gql`
  query CompaniesForVerification(
    $first: Int
    $skip: Int
    $where: CompanyForVerificationWhere
  ) {
    companiesForVerification(first: $first, skip: $skip, where: $where) {
      totalCount
      companies {
        id
        createdAt
        siret
        orgId
        name
        companyTypes
        verificationStatus
        verificationComment
        verificationMode
        admin {
          email
          name
          phone
        }
      }
    }
  }
`;
