import React from "react";
import { useQuery, gql } from "@apollo/client";
import AccountMenu from "./AccountMenu";
import { Route, Navigate, Routes, Link } from "react-router-dom";
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
import routes, { getRelativeRoute } from "../Apps/routes";
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

const toRelative = route => {
  return getRelativeRoute(routes.account.index, route);
};

export default function Account() {
  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME);

  if (loading) return <Loader />;

  if (error) return <InlineError apolloError={error} />;

  if (data) {
    return (
      <div id="account" className="account dashboard">
        <AccountMenu />
        <div className="dashboard-content">
          <Routes>
            <Route
              path={toRelative(routes.account.info)}
              element={
                <AccountContentWrapper title="Informations générales">
                  <AccountInfo me={data.me} />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.account.authorizedApplications)}
              element={
                <AccountContentWrapper title="Applications tierces autorisées">
                  <AccountAuthorizedAppList />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.account.tokens.list)}
              element={<AccountAccessTokenList />}
            />

            <Route
              path={toRelative(routes.account.oauth2.list)}
              element={
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
              }
            />

            <Route
              path={toRelative(routes.account.oauth2.create)}
              element={
                <AccountContentWrapper title="Créer une application tierce sur la plateforme Trackdéchets">
                  <AccountOAuth2AppCreateUpdate />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.account.oauth2.edit)}
              element={
                <AccountContentWrapper title="Modifier une application OAuth2">
                  <AccountOAuth2AppCreateUpdate />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.account.companies.orientation)}
              element={
                <AccountContentWrapper title="">
                  <AccountCompanyOrientation />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.account.companies.list)}
              element={
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
              }
            />

            <Route
              path={toRelative(routes.account.companies.create.simple)}
              element={
                <AccountContentWrapper title="Créer un établissement">
                  <AccountCompanyAddProducer />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.account.companies.create.pro)}
              element={
                <AccountContentWrapper title="Créer un établissement">
                  <AccountCompanyAdd />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.account.companies.create.foreign)}
              element={
                <AccountContentWrapper title="Créer un transporteur étranger">
                  <AccountCompanyAddForeign />
                </AccountContentWrapper>
              }
            />

            <Route
              path={`${routes.account.index}/*`}
              element={<Navigate to={routes.account.info} replace />}
            />
          </Routes>
        </div>
      </div>
    );
  }
  return null;
}
