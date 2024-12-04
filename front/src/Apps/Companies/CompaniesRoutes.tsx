import React from "react";
import { useQuery } from "@apollo/client";
import CompaniesMenu from "./CompaniesMenu";
import { Route, Navigate, Routes } from "react-router-dom";
import Loader from "../common/Components/Loader/Loaders";
import { InlineError } from "../common/Components/Error/Error";
import CompaniesList from "./CompaniesList/CompaniesList";
import AccountContentWrapper from "../Account/AccountContentWrapper";
import AccountCompanyAdd from "./AccountCompanyAdd/AccountCompanyAdd";
import AccountCompanyAddProducer from "./AccountCompanyAdd/AccountCompanyAddProducer";
import AccountCompanyAddForeign from "./AccountCompanyAdd/AccountCompanyAddForeign";
import CompanyDetails from "./CompanyDetails";
import { Query } from "@td/codegen-ui";
import routes, { getRelativeRoute } from "../routes";
import AccountCompanyOrientation from "./AccountCompanyOrientation";
import "../Dashboard/dashboard.scss";

import { useMedia } from "../../common/use-media";
import { MEDIA_QUERIES } from "../../common/config";
import { GET_ME } from "./common/queries";

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
        <div className="dashboard-content" tabIndex={-1}>
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
