import React from "react";
import { useQuery, gql } from "@apollo/client";
import AccountMenu from "./AccountMenu";
import { Route, withRouter, Redirect, Switch, Link } from "react-router-dom";
import Loader from "../Apps/common/Components/Loader/Loaders";
import { InlineError } from "../Apps/common/Components/Error/Error";
import AccountInfo from "./AccountInfo";
import AccountAccessTokenList from "./accessTokens/AccountAccessTokenList";
import AccountCompanyList from "./AccountCompanyList";
import AccountContentWrapper from "./AccountContentWrapper";
import AccountCompanyAdd from "./AccountCompanyAdd";
import AccountCompanyAddProducer from "./AccountCompanyAddProducer";
import AccountCompanyAddForeign from "./AccountCompanyAddForeign";
import AccountOauth2AppList from "./oauth2/AccountOauth2AppList";
import AccountOAuth2AppCreateUpdate from "./oauth2/AccountOauth2AppCreateUpdate";
import { Query } from "codegen-ui";
import routes from "../Apps/routes";
import AccountAuthorizedAppList from "./apps/AccountAuthorizedAppList";
import AccountCompanyOrientation from "./AccountCompanyOrientation";

export const GET_ME = gql`
  {
    me {
      ...AccountInfoFragment
    }
  }
  ${AccountInfo.fragments.me}
`;

export default withRouter(function Account() {
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
                  <AccountInfo me={data.me} />
                </AccountContentWrapper>
              )}
            />
            <Route
              path={routes.account.authorizedApplications}
              render={() => (
                <AccountContentWrapper title="Applications tierces autorisées">
                  <AccountAuthorizedAppList />
                </AccountContentWrapper>
              )}
            />
            <Route
              path={routes.account.tokens.list}
              render={() => <AccountAccessTokenList />}
            />
            <Route
              exact
              path={routes.account.oauth2.list}
              render={() => (
                <AccountContentWrapper
                  title="Mes applications tierces"
                  button={
                    <Link
                      className="btn btn--primary"
                      to={routes.account.oauth2.create}
                    >
                      Créer une application tierce
                    </Link>
                  }
                >
                  <AccountOauth2AppList />
                </AccountContentWrapper>
              )}
            />
            <Route
              path={routes.account.oauth2.create}
              render={() => (
                <AccountContentWrapper title="Créer une application tierce sur la plateforme Trackdéchets">
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
            <Route path={routes.account.companies.orientation}>
              <AccountContentWrapper title="">
                <AccountCompanyOrientation />
              </AccountContentWrapper>
            </Route>
            <Route
              exact
              path={routes.account.companies.list}
              render={() => (
                <AccountContentWrapper
                  title="Établissements"
                  button={
                    <Link
                      className="btn btn--primary"
                      to={routes.account.companies.orientation}
                    >
                      Créer un établissement
                    </Link>
                  }
                >
                  <AccountCompanyList />
                </AccountContentWrapper>
              )}
            />
            <Route path={routes.account.companies.create.simple}>
              <AccountContentWrapper title="Créer un établissement">
                <AccountCompanyAddProducer />
              </AccountContentWrapper>
            </Route>
            <Route path={routes.account.companies.create.pro}>
              <AccountContentWrapper title="Créer un établissement">
                <AccountCompanyAdd />
              </AccountContentWrapper>
            </Route>
            <Route path={routes.account.companies.create.foreign}>
              <AccountContentWrapper title="Créer un transporteur étranger">
                <AccountCompanyAddForeign />
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
