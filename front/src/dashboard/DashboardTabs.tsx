import React from "react";
import { generatePath, NavLink, useHistory } from "react-router-dom";
import { CompanyPrivate, CompanyType } from "generated/graphql/types";
import DashboardCompanySelector from "./DashboardCompanySelector";
import routes from "Apps/routes";
import "./DashboardTabs.scss";

interface DashboardTabsProps {
  currentCompany: CompanyPrivate;
  companies: CompanyPrivate[];
}

export function DashboardTabs({
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
                generatePath(routes.dashboard.bsds.drafts, {
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
              to={generatePath(routes.dashboard.bsds.drafts, {
                siret: currentCompany.orgId,
              })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              Brouillons
            </NavLink>
          </li>

          <li>
            <NavLink
              to={generatePath(routes.dashboard.bsds.act, {
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
              to={generatePath(routes.dashboard.bsds.follow, {
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
              to={generatePath(routes.dashboard.bsds.history, {
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
              to={generatePath(routes.dashboard.bsds.reviews, {
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
                  to={generatePath(routes.dashboard.transport.toCollect, {
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
                  to={generatePath(routes.dashboard.transport.collected, {
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
              to={generatePath(routes.dashboard.exports, {
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
