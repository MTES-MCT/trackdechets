import React from "react";
import { useQuery, gql } from "@apollo/client";
import AccountMenu from "./AccountMenu";
import { Route, Navigate, Routes, Link } from "react-router-dom";
import Loader from "../Apps/common/Components/Loader/Loaders";
import { InlineError } from "../Apps/common/Components/Error/Error";
import { Redirect } from "../Apps/utils/routerUtils";
import AccountInfo from "./AccountInfo";
import AccountAccessTokenList from "./accessTokens/AccountAccessTokenList";
import AccountContentWrapper from "./AccountContentWrapper";
import AccountOauth2AppList from "./oauth2/AccountOauth2AppList";
import AccountOAuth2AppCreateUpdate from "./oauth2/AccountOauth2AppCreateUpdate";
import { Query } from "@td/codegen-ui";
import routes, { getRelativeRoute } from "../Apps/routes";
import AccountAuthorizedAppList from "./apps/AccountAuthorizedAppList";

import "../Apps/Dashboard/dashboard.scss";
import { useMedia } from "../common/use-media";
import { MEDIA_QUERIES } from "../common/config";

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

  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  if (loading) return <Loader />;

  if (error) return <InlineError apolloError={error} />;

  if (data) {
    return (
      <div id="account" className="account dashboard">
        {!isMobile && <AccountMenu />}
        <div className="dashboard-content">
          <Routes>
            <Route index element={<Redirect path={routes.account.info} />} />

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
                  additional={
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
              element={<Redirect path={routes.companies.orientation} />}
            />

            <Route
              path={toRelative(routes.account.companies.list)}
              element={<Redirect path={routes.companies.index} />}
            />

            <Route
              path={toRelative(routes.account.companies.create.simple)}
              element={<Redirect path={routes.companies.create.simple} />}
            />

            <Route
              path={toRelative(routes.account.companies.create.pro)}
              element={<Redirect path={routes.companies.create.pro} />}
            />

            <Route
              path={toRelative(routes.account.companies.create.foreign)}
              element={<Redirect path={routes.companies.create.foreign} />}
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
