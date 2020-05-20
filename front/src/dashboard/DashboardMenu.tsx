import React, { useContext } from "react";
import { Me } from "../login/model";
import "./DashboardMenu.scss";
import { NavLink, match } from "react-router-dom";
import CompanySelector from "./CompanySelector";
import SideMenu from "../common/SideMenu";
import { SiretContext } from "./Dashboard";
import { CompanyType, User } from "../generated/graphql/types";

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

  const company = companies.find((c) => c.siret === siret);

  if (company) {
    const isTransporter =
      company.companyTypes.indexOf(CompanyType.Transporter) > -1;

    return (
      <SideMenu>
        <>
          {companies.length === 1 && (
            <div className="company-title">{companies[0].name}</div>
          )}
          {companies.length > 1 && (
            <div className="company-select">
              <CompanySelector
                siret={siret}
                companies={companies}
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
