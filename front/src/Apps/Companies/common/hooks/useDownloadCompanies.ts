import { gql, useLazyQuery } from "@apollo/client";
import { Query, QueryBsdaPdfArgs } from "@td/codegen-ui";

export const MY_COMPANIES_CSV = gql`
  query MyCompaniesCsv {
    myCompaniesCsv {
      downloadLink
      token
    }
  }
`;

export const MY_COMPANIES_XLS = gql`
  query MyCompaniesXls {
    myCompaniesXls {
      downloadLink
      token
    }
  }
`;

export function useDownloadMyCompaniesCsv() {
  return useLazyQuery<Pick<Query, "myCompaniesCsv">, QueryBsdaPdfArgs>(
    MY_COMPANIES_CSV,
    {
      fetchPolicy: "network-only",
      onCompleted: ({ myCompaniesCsv }) => {
        if (myCompaniesCsv?.downloadLink) {
          window.open(myCompaniesCsv.downloadLink, "_blank");
        }
      }
    }
  );
}

export function useDownloadMyCompaniesXls() {
  return useLazyQuery<Pick<Query, "myCompaniesXls">, QueryBsdaPdfArgs>(
    MY_COMPANIES_XLS,
    {
      fetchPolicy: "network-only",
      onCompleted: ({ myCompaniesXls }) => {
        if (myCompaniesXls?.downloadLink) {
          window.open(myCompaniesXls.downloadLink, "_blank");
        }
      }
    }
  );
}
