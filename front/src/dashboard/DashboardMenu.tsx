import React from "react";
import { generatePath, NavLink, useParams } from "react-router-dom";
import SideMenu from "common/components/SideMenu";
import { CompanyType, User } from "generated/graphql/types";
import DashboardCompanySelector from "./DashboardCompanySelector";
import "./DashboardMenu.scss";
import { routes } from "common/routes";

interface IProps {
  me: User;
  handleCompanyChange: (siret: string) => void;
}

export default function DashboardMenu({ me, handleCompanyChange }: IProps) {
  const { siret } = useParams<{ siret: string }>();
  const companies = me.companies || [];
  const company = companies.find(c => c.siret === siret);

  return (
    <SideMenu>
      <>
        {companies.length > 1 ? (
          <div className="company-select">
            <DashboardCompanySelector
              siret={siret}
              companies={companies}
              handleCompanyChange={handleCompanyChange}
            />
          </div>
        ) : (
          <div className="company-title">{company?.name}</div>
        )}

        {company && (
          <>
            <p className="sidebar__chapter">Mes bordereaux</p>
            <ul>
              <li>
                <NavLink
                  to={generatePath(routes.dashboard.slips.drafts, { siret })}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  Brouillon
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={generatePath(routes.dashboard.slips.act, { siret })}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  Pour action
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={generatePath(routes.dashboard.slips.follow, { siret })}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  Suivi
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={generatePath(routes.dashboard.slips.history, { siret })}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  Archives
                </NavLink>
              </li>
            </ul>

            {company.companyTypes.includes(CompanyType.Transporter) && (
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
        )}
      </>
    </SideMenu>
  );
}
