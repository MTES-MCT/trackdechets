import React from "react";
import { useLazyQuery } from "@apollo/client";
import { Query, QueryCompanyPrivateInfosArgs } from "generated/graphql/types";

import { COMPANY_SELECTOR_PRIVATE_INFOS } from "form/common/components/company/query";

export const ApolloCompanyPrivateInfosContext = React.createContext({
  queryCompanyPrivateInfos: (orgId: string, callback: () => void) => {},
});

/**
 * Propagates the complete company data
 * to the form when a company is selected or un-selected
 */
const ApolloCompanyPrivateInfosProvider = ({ children }) => {
  const [searchCompaniesQuery, { loading, error }] = useLazyQuery<
    Pick<Query, "companyPrivateInfos">,
    QueryCompanyPrivateInfosArgs
  >(COMPANY_SELECTOR_PRIVATE_INFOS);

  const queryCompanyPrivateInfos = React.useCallback(
    (orgId, callback) => {
      if (!loading && !error) {
        // refetch the data
        searchCompaniesQuery({
          variables: {
            clue: orgId!,
          },
          onCompleted(data) {
            callback(data);
          },
        });
      }
    },
    [loading, error, searchCompaniesQuery]
  );

  return (
    <ApolloCompanyPrivateInfosContext.Provider
      value={{ queryCompanyPrivateInfos }}
    >
      {children}
    </ApolloCompanyPrivateInfosContext.Provider>
  );
};

export default ApolloCompanyPrivateInfosProvider;
