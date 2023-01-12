import React from "react";
import { generatePath, NavLink, useHistory } from "react-router-dom";
import { CompanyPrivate, CompanyType } from "generated/graphql/types";
import DashboardCompanySelector from "../../../../dashboard/DashboardCompanySelector";
import routes from "common/routes";
import "./DashboardTabs.scss";

interface DashboardTabsProps {
  currentCompany: CompanyPrivate;
  companies: CompanyPrivate[];
}

export default function DashboardTabs({
  currentCompany,
  companies,
}: DashboardTabsProps) {
  const history = useHistory();

  return (
    <>
      {companies.length > 1 ? (
        <div className="company-select">
          <DashboardCompanySelector
            orgId={currentCompany.orgId}
            companies={companies}
            handleCompanyChange={orgId =>
              history.push(
                generatePath(routes.dashboardv2.bsds.drafts, {
                  siret: orgId,
                })
              )
            }
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
              Brouillon
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
              Pour action
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
              Suivi
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
              Archives
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
              Révisions
            </NavLink>
          </li>
        </ul>

        {currentCompany.companyTypes.includes(CompanyType.Transporter) && (
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
                  À collecter
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
                  Collecté
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
              Registre
            </NavLink>
          </li>
        </ul>
      </>
    </>
  );
}
