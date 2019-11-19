import React from "react";
import { Me } from "../login/model";
import "./DashboardMenu.scss";
import { NavLink, match } from "react-router-dom";
import CompanySelector from "./CompanySelector";
import { Company } from "../login/model";
import SideMenu from "../common/SideMenu";

interface IProps {
  me: Me;
  match: match<{}>;
  siret: string;
  handleCompanyChange: (siret: string) => void;
}

export default function DashboardMenu({
  me,
  match,
  siret,
  handleCompanyChange
}: IProps) {
  const company = me.companies.find((c: Company) => c.siret === siret);
  const isTransporter = company
    ? company.companyTypes.indexOf("TRANSPORTER") > -1
    : false;

  return (
    <SideMenu>
      <>
        <div className="company-title">
          <CompanySelector
            siret={siret}
            companies={me.companies}
            handleCompanyChange={handleCompanyChange}
          />
        </div>
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
