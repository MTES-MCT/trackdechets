import React from "react";
import { generatePath, NavLink, useHistory } from "react-router-dom";
import { CompanyType, User } from "generated/graphql/types";
import DashboardCompanySelector from "./DashboardCompanySelector";
import routes from "common/routes";
import "./DashboardTabs.scss";

interface DashboardTabsProps {
  me: User;
  siret: string;
}

export function DashboardTabs({ me, siret }: DashboardTabsProps) {
  const history = useHistory();
  const companies = me.companies || [];
  const currentCompany = companies.find(company => company.siret === siret)!;

  return (
    <>
      {companies.length > 1 ? (
        <div className="company-select">
          <DashboardCompanySelector
            siret={siret}
            companies={companies}
            handleCompanyChange={siret =>
              history.push(
                generatePath(routes.dashboard.bsds.drafts, {
                  siret,
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
              to={generatePath(routes.dashboard.bsds.drafts, { siret })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              Brouillon
            </NavLink>
          </li>

          <li>
            <NavLink
              to={generatePath(routes.dashboard.bsds.act, { siret })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              Pour action
            </NavLink>
          </li>

          <li>
            <NavLink
              to={generatePath(routes.dashboard.bsds.follow, { siret })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              Suivi
            </NavLink>
          </li>
          <li>
            <NavLink
              to={generatePath(routes.dashboard.bsds.history, { siret })}
              className="sidebar__link sidebar__link--indented"
              activeClassName="sidebar__link--active"
            >
              Archives
            </NavLink>
          </li>
          <li>
            <NavLink
              to={generatePath(routes.dashboard.bsds.reviews, { siret })}
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
                    siret,
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
                    siret,
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
              to={generatePath(routes.dashboard.exports, { siret })}
              className="sidebar__link sidebar__link--chapter"
              activeClassName="sidebar__link--active"
            >
              Registre
            </NavLink>
          </li>

          <li>
            <NavLink
              to={generatePath(routes.dashboard.stats, { siret })}
              className="sidebar__link sidebar__link--chapter"
              activeClassName="sidebar__link--active"
            >
              Statistiques
            </NavLink>
          </li>
        </ul>
      </>
    </>
  );
}
