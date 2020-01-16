import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import { useQuery } from "@apollo/react-hooks";
import AccountMenu from "./AccountMenu";
import { Route, withRouter, RouteComponentProps } from "react-router";
import Loader from "../common/Loader";
import Error from "../common/Error";
import AccountInfo from "./AccountInfo";
import AccountIntegrationApi from "./AccountIntegrationApi";
import AccountCompanyList from "./AccountCompanyList";
import AccountContentWrapper from "./AccountContentWrapper";
import AccountCompanyAdd from "./AccountCompanyAdd";

const GET_ME = gql`
  {
    me {
      ...AccountInfoFragment
      companies {
        ...AccountCompaniesFragment
      }
    }
  }
  ${AccountInfo.fragments.me}
  ${AccountCompanyList.fragments.company}
`;

export default withRouter(function Account({ match }: RouteComponentProps) {
  const { loading, error, data } = useQuery(GET_ME);

  if (loading) return <Loader />;

  if (error) return <Error message={error.message} />;

  return (
    <div id="account" className="account dashboard">
      <AccountMenu match={match} />
      <div className="dashboard-content">
        <Route
          path={`${match.path}/info`}
          render={() => (
            <AccountContentWrapper title="Informations générales">
              <AccountInfo me={filter(AccountInfo.fragments.me, data.me)} />
            </AccountContentWrapper>
          )}
        />
        <Route
          path={`${match.path}/api`}
          render={() => (
            <AccountContentWrapper title="Intégration API">
              <AccountIntegrationApi />
            </AccountContentWrapper>
          )}
        />
        <Route
          exact
          path={`${match.path}/companies`}
          render={() => (
            <AccountContentWrapper title="Établissements">
              <AccountCompanyList
                companies={filter(
                  AccountCompanyList.fragments.company,
                  data.me.companies
                )}
              />
            </AccountContentWrapper>
          )}
        />
        <Route path={`${match.path}/companies/new`}>
          <AccountContentWrapper title="Création d'un nouvel établissement">
            <AccountCompanyAdd />
          </AccountContentWrapper>
        </Route>
      </div>
    </div>
  );
});
