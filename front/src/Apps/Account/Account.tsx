import React from "react";
import { useQuery, gql } from "@apollo/client";
import AccountMenu from "./AccountMenu";
import { Route, Navigate, Routes } from "react-router-dom";
import Loader from "../common/Components/Loader/Loaders";
import { InlineError } from "../common/Components/Error/Error";
import { Redirect } from "../utils/routerUtils";
import AccountInfo from "./AccountInfo/AccountInfo";
import AccountContentWrapper from "./AccountContentWrapper";
import { Query } from "@td/codegen-ui";
import routes, { getRelativeRoute } from "../routes";
import AccountApplications from "./AccountApplications/AccountApplications";

import "../Dashboard/dashboard.scss";
import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";

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
                <AccountContentWrapper title="Mes paramètres">
                  <AccountInfo me={data.me} />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.account.applications)}
              element={
                <AccountContentWrapper title="Applications et API">
                  <AccountApplications />
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
