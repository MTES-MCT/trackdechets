import React from "react";
import gql from "graphql-tag";
import { filter } from "graphql-anywhere";
import { useQuery } from "@apollo/react-hooks";
import AccountMenu from "./AccountMenu";
import {
  Route,
  withRouter,
  RouteComponentProps,
  useHistory,
  Redirect,
  Switch,
} from "react-router";
import Loader from "common/components/Loaders";
import { InlineError } from "common/components/Error";
import AccountInfo from "./AccountInfo";
import AccountIntegrationApi from "./AccountIntegrationApi";
import AccountCompanyList from "./AccountCompanyList";
import AccountContentWrapper from "./AccountContentWrapper";
import AccountCompanyAdd from "./AccountCompanyAdd";
import { Query } from "generated/graphql/types";

export const GET_ME = gql`
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
  const history = useHistory();
  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME);

  if (loading) return <Loader />;

  if (error) return <InlineError apolloError={error} />;

  if (data) {
    return (
      <div id="account" className="account dashboard">
        <AccountMenu />
        <div className="dashboard-content">
          <Switch>
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
                <AccountContentWrapper
                  title="Établissements"
                  button={
                    <a
                      className="btn btn--primary"
                      href={`${match.path}/companies/new`}
                    >
                      Créer un établissement
                    </a>
                  }
                >
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
              <AccountContentWrapper title="Créer un établissement">
                <AccountCompanyAdd />
              </AccountContentWrapper>
            </Route>
            <Redirect to={`${match.path}/info`} />
          </Switch>
        </div>
      </div>
    );
  }
  return null;
});
