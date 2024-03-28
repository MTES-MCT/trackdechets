import React from "react";
import { useQuery, gql } from "@apollo/client";
import CompaniesMenu from "./CompaniesMenu";
import { Route, Navigate, Routes } from "react-router-dom";
import Loader from "../Apps/common/Components/Loader/Loaders";
import { InlineError } from "../Apps/common/Components/Error/Error";
import AccountInfo from "../account/AccountInfo";
import CompaniesList from "./CompaniesList";
import AccountContentWrapper from "../account/AccountContentWrapper";
import AccountCompanyAdd from "./AccountCompanyAdd";
import AccountCompanyAddProducer from "./AccountCompanyAddProducer";
import AccountCompanyAddForeign from "./AccountCompanyAddForeign";
import CompanyDetails from "./CompanyDetails";
import { Query } from "@td/codegen-ui";
import routes, { getRelativeRoute } from "../Apps/routes";
import AccountCompanyOrientation from "./AccountCompanyOrientation";

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
  return getRelativeRoute(routes.companies.index, route);
};

export default function CompaniesRoutes() {
  const { loading, error, data } = useQuery<Pick<Query, "me">>(GET_ME);

  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  if (loading) return <Loader />;

  if (error) return <InlineError apolloError={error} />;

  if (data) {
    return (
      <div id="companies" className="companies dashboard">
        {!isMobile && <CompaniesMenu />}
        <div className="dashboard-content">
          <Routes>
            <Route index element={<CompaniesList />} />

            <Route
              path={toRelative(routes.companies.details)}
              element={<CompanyDetails />}
            />

            <Route
              path={toRelative(routes.companies.orientation)}
              element={
                <AccountContentWrapper title="">
                  <AccountCompanyOrientation />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.companies.create.simple)}
              element={
                <AccountContentWrapper title="Créer un établissement">
                  <AccountCompanyAddProducer />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.companies.create.pro)}
              element={
                <AccountContentWrapper title="Créer un établissement">
                  <AccountCompanyAdd />
                </AccountContentWrapper>
              }
            />

            <Route
              path={toRelative(routes.companies.create.foreign)}
              element={
                <AccountContentWrapper title="Créer un transporteur étranger">
                  <AccountCompanyAddForeign />
                </AccountContentWrapper>
              }
            />

            <Route
              path={`${routes.companies.index}/*`}
              element={<Navigate to={routes.companies.index} replace />}
            />
          </Routes>
        </div>
      </div>
    );
  }
  return null;
}
