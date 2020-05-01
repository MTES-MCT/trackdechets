import React from "react";
import "./DashboardMenu.scss";
import { NavLink, match } from "react-router-dom";
import CompanySelector from "./CompanySelector";
import SideMenu from "../common/SideMenu";
import { User, CompanyType } from "../generated/graphql/types";

interface IProps {
  me: User;
  match: match<{}>;
  siret: string;
  handleCompanyChange: (siret: string) => void;
}

export default function DashboardMenu({
  me,
  match,
  siret,
  handleCompanyChange,
}: IProps) {
  const company = me.companies.find((c) => c.siret === siret);

  if (company) {
    const isTransporter =
      company.companyTypes.indexOf(CompanyType.Transporter) > -1;

    return (
      <SideMenu>
        <>
          {me.companies.length === 1 && (
            <div className="company-title">{me.companies[0].name}</div>
          )}
          {me.companies.length > 1 && (
            <div className="company-select">
              <CompanySelector
                siret={siret}
                companies={me.companies}
                handleCompanyChange={handleCompanyChange}
              />
            </div>
          )}

          <ul>
            <li>
              <NavLink to={`${match.url}/slips`} activeClassName="active">
                Mes bordereaux
              </NavLink>
            </li>
            {isTransporter && (
              <li>
                <NavLink to={`${match.url}/transport`} activeClassName="active">
                  Transport
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to={`${match.url}/exports`} activeClassName="active">
                Registre
              </NavLink>
            </li>
          </ul>
        </>
      </SideMenu>
    );
  }

  return null;
}
