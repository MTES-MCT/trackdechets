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
          <ul>
            <li>
              <NavLink to={`${match.url}/slips`} activeClassName="active">
                Mes bordereaux
              </NavLink>
            </li>
            {company.companyTypes.includes(CompanyType.Transporter) && (
              <li>
                <NavLink to={`${match.url}/transport`} activeClassName="active">
                  Transport
                </NavLink>
              </li>
            )}

            <li>
              <NavLink to={`${match.url}/stats`} activeClassName="active">
                Statistiques
              </NavLink>
            </li>
            <li>
              <NavLink to={`${match.url}/exports`} activeClassName="active">
                Registre
              </NavLink>
            </li>
          </ul>
        )}
      </>
    </SideMenu>
  );
}
