import React, { useContext } from "react";
import { match, NavLink } from "react-router-dom";
import SideMenu from "src/common/components/SideMenu";
import { CompanyType, User } from "src/generated/graphql/types";
import CompanySelector from "./CompanySelector";
import { SiretContext } from "./Dashboard";
import "./DashboardMenu.scss";

interface IProps {
  me: User;
  match: match<{}>;
  handleCompanyChange: (siret: string) => void;
}

export default function DashboardMenu({
  me,
  match,
  handleCompanyChange,
}: IProps) {
  const { siret } = useContext(SiretContext);
  const companies = me.companies || [];
  const company = companies.find(c => c.siret === siret);

  return (
    <SideMenu>
      <>
        {companies.length > 1 ? (
          <div className="company-select">
            <CompanySelector
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
            <p className="sidebar__chapter">Mes bordereaux 2</p>
            <ul>
              <li>
                <NavLink
                  to={`${match.url}/slips/drafts`}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  Brouillon
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={`${match.url}/slips/act`}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  Pour action
                </NavLink>
              </li>

              <li>
                <NavLink
                  to={`${match.url}/slips/follow`}
                  className="sidebar__link sidebar__link--indented"
                  activeClassName="sidebar__link--active"
                >
                  Suivi
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={`${match.url}/slips/history`}
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
                      to={`${match.url}/transport/to-collect`}
                      className="sidebar__link sidebar__link--indented"
                      activeClassName="sidebar__link--active"
                    >
                      À collecter
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to={`${match.url}/transport/collected`}
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
                  to={`${match.url}/exports`}
                  className="sidebar__link sidebar__link--chapter"
                  activeClassName="sidebar__link--active"
                >
                  Registre
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={`${match.url}/stats`}
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
