import React, { useCallback } from "react";
import { generatePath, NavLink, useHistory } from "react-router-dom";
import { CompanyPrivate } from "generated/graphql/types";
import DashboardCompanySelector from "../../../../dashboard/DashboardCompanySelector";
import routes from "Apps/routes";
import "./DashboardTabs.scss";
import {
  ACTS,
  ARCHIVES,
  COLLECTED,
  DRAFTS,
  FOLLOWS,
  REGISTER,
  REVIEWS,
  TO_COLLECT,
} from "Apps/common/wordings/dashboard/wordingsDashboard";
import { useShowTransportTabs } from "dashboard/transport/hooks/useShowTransportTabs";

interface DashboardTabsProps {
  currentCompany: CompanyPrivate;
  companies: CompanyPrivate[];
}

export default function DashboardTabs({
  currentCompany,
  companies,
}: DashboardTabsProps) {
  const history = useHistory();

  const handleCompanyChange = useCallback(
    orgId => {
      history.push(
        generatePath(routes.dashboardv2.bsds.drafts, {
          siret: orgId,
        })
      );
    },
    [history]
  );

  const { showTransportTabs } = useShowTransportTabs(
    currentCompany.companyTypes,
    currentCompany.siret
  );

  return (
    <>
      {companies.length > 1 ? (
        <div className="company-select">
          <DashboardCompanySelector
            orgId={currentCompany.orgId}
            companies={companies}
            handleCompanyChange={handleCompanyChange}
          />
        </div>
      ) : (
        <div className="company-title">{currentCompany.name}</div>
      )}

      <>
        <p className="sidebar__chapter">Mes bordereaux</p>
        <ul>
          <li>
            <NavLink
              to={generatePath(routes.dashboardv2.bsds.drafts, {
                siret: currentCompany.orgId,
              })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              {DRAFTS}
            </NavLink>
          </li>

          <li>
            <NavLink
              to={generatePath(routes.dashboardv2.bsds.act, {
                siret: currentCompany.orgId,
              })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              {ACTS}
            </NavLink>
          </li>

          <li>
            <NavLink
              to={generatePath(routes.dashboardv2.bsds.follow, {
                siret: currentCompany.orgId,
              })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              {FOLLOWS}
            </NavLink>
          </li>
          <li>
            <NavLink
              to={generatePath(routes.dashboardv2.bsds.history, {
                siret: currentCompany.orgId,
              })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              {ARCHIVES}
            </NavLink>
          </li>
          <li>
            <NavLink
              to={generatePath(routes.dashboardv2.bsds.reviews, {
                siret: currentCompany.orgId,
              })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              {REVIEWS}
            </NavLink>
          </li>
        </ul>

        {showTransportTabs && (
          <>
            <p className="sidebar__chapter ">Transport</p>
            <ul>
              <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.transport.toCollect, {
                    siret: currentCompany.orgId,
                  })}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  {TO_COLLECT}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboardv2.transport.collected, {
                    siret: currentCompany.orgId,
                  })}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  {COLLECTED}
                </NavLink>
              </li>
            </ul>
          </>
        )}

        <ul>
          <li>
            <NavLink
              to={generatePath(routes.dashboardv2.exports, {
                siret: currentCompany.orgId,
              })}
              className="sidebar__link sidebar__link--chapter"
              activeClassName="sidebar__link--active"
            >
              {REGISTER}
            </NavLink>
          </li>
        </ul>
      </>
    </>
  );
}
