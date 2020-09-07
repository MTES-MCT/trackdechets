import React, { useContext } from "react";
import { match, NavLink } from "react-router-dom";
import SideMenu from "../common/SideMenu";
import { CompanyType, User } from "../generated/graphql/types";
import CompanySelector from "./CompanySelector";
import { SiretContext } from "./Dashboard";
import "./DashboardMenu.scss";

interface IProps {
  me: User;
  match: match<{}>;
  handleCompanyChange: (siret: string) => void;
}

export default function DashboardMenu2({
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
            <p className="sidebar-chapter ">Mes bordereaux</p>
            <ul>
              {/* <NavTab to={`${url}/drafts`}>Mes brouillons</NavTab>
        <NavTab to={`${url}/act`}>Agir sur mes bordereaux</NavTab>
        <NavTab to={`${url}/follow`}>Suivre mes bordereaux</NavTab>
        <NavTab to={`${url}/history`}>Mes bordereaux archivés</NavTab> */}
              <li>
                <NavLink
                  to={`${match.url}/slips/drafts`}
                  activeClassName="active"
                >
                  Brouillon
                </NavLink>
              </li>
              <li>
                <NavLink to={`${match.url}/slips/act`} activeClassName="active">
                  Pour action
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={`${match.url}/slips/follow`}
                  activeClassName="active"
                >
                  Suivi
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={`${match.url}/slips/history`}
                  activeClassName="active"
                >
                  Archivé
                </NavLink>
              </li>
            </ul>

            {company.companyTypes.includes(CompanyType.Transporter) && (
              <>
                <p className="sidebar-chapter ">Transport</p>
                <ul>
                  <li>
                    <NavLink
                      to={`${match.url}/transport/to-collect`}
                      activeClassName="active"
                    >
                      À collecter
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to={`${match.url}/transport/collected`}
                      activeClassName="active"
                    >
                      Collecté
                    </NavLink>
                  </li>
                </ul>
              </>
            )}
            <ul>
              <li>
                <NavLink to={`${match.url}/exports`} activeClassName="active">
                  Registre
                </NavLink>
              </li>
              <li>
                <NavLink to={`${match.url}/stats`} activeClassName="active">
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
