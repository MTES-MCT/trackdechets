import React from "react";
import { filter } from "graphql-anywhere";
import { useQuery, gql } from "@apollo/client";
import AccountMenu from "./AccountMenu";
import {
  Route,
  withRouter,
  RouteComponentProps,
  Redirect,
  Switch,
} from "react-router-dom";
import Loader from "common/components/Loaders";
import { InlineError } from "common/components/Error";
import AccountInfo from "./AccountInfo";
import AccountIntegrationApi from "./AccountIntegrationApi";
import AccountCompanyList from "./AccountCompanyList";
import AccountContentWrapper from "./AccountContentWrapper";
import AccountCompanyAdd from "./AccountCompanyAdd";
import AccountOauth2AppList from "./oauth2/AccountOauth2AppList";
import AccountOAuth2AppCreateUpdate from "./oauth2/AccountOauth2AppCreateUpdate";
import { Query } from "generated/graphql/types";
import routes from "common/routes";

export const GET_ME = gql`
  {
    me {
      ...AccountInfoFragment
    }
  }
  ${AccountInfo.fragments.me}
`;

export default withRouter(function Account({ match }: RouteComponentProps) {
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
              path={routes.account.info}
              render={() => (
                <AccountContentWrapper title="Informations générales">
                  <AccountInfo me={filter(AccountInfo.fragments.me, data.me)} />
                </AccountContentWrapper>
              )}
            />
            <Route
              path={routes.account.api}
              render={() => (
                <AccountContentWrapper title="Intégration API">
                  <AccountIntegrationApi />
                </AccountContentWrapper>
              )}
            />
            <Route
              exact
              path={routes.account.oauth2.list}
              render={() => (
                <AccountContentWrapper
                  title="Mes applications OAuth2"
                  button={
                    <a
                      className="btn btn--primary"
                      href={routes.account.oauth2.create}
                    >
                      Créer une application OAuth2
                    </a>
                  }
                >
                  <AccountOauth2AppList />
                </AccountContentWrapper>
              )}
            />
            <Route
              path={routes.account.oauth2.create}
              render={() => (
                <AccountContentWrapper title="Créer une application OAuth2">
                  <AccountOAuth2AppCreateUpdate />
                </AccountContentWrapper>
              )}
            />
            <Route
              path={routes.account.oauth2.edit}
              render={({ match }) => (
                <AccountContentWrapper title="Modifier une application OAuth2">
                  <AccountOAuth2AppCreateUpdate id={match.params.id} />
                </AccountContentWrapper>
              )}
            />
            <Route
              exact
              path={routes.account.companies.list}
              render={() => (
                <AccountContentWrapper
                  title="Établissements"
                  button={
                    <a
                      className="btn btn--primary"
                      href={routes.account.companies.create}
                    >
                      Créer un établissement
                    </a>
                  }
                >
                  <AccountCompanyList />
                </AccountContentWrapper>
              )}
            />
            <Route path={routes.account.companies.create}>
              <AccountContentWrapper title="Créer un établissement">
                <AccountCompanyAdd />
              </AccountContentWrapper>
            </Route>
            <Redirect to={routes.account.info} />
          </Switch>
        </div>
      </div>
    );
  }
  return null;
});
