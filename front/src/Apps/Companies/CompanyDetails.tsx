import React from "react";
import { useQuery } from "@apollo/client";
import AccountCompanySecurity from "./AccountCompanySecurity";
import AccountCompanyMemberList from "./AccountCompanyMemberList";
import CompanyInfo from "./CompanyInfo/CompanyInfo";
import CompanyContactForm from "./CompanyContact/CompanyContactForm";
import CompanyAdvanced from "./CompanyAdvanced/CompanyAdvanced";
import { Query, QueryMyCompaniesArgs, UserRole } from "@td/codegen-ui";
import { Navigate, useParams } from "react-router-dom";
import { userRole } from "./CompaniesList/CompaniesList";
import { MY_COMPANIES } from "./common/queries";
import { Loader } from "../common/Components";
import { NotificationError } from "../common/Components/Error/Error";
import routes from "../routes";
import AccountContentWrapper from "../Account/AccountContentWrapper";
import AccountCompanyInfo from "./AccountCompanyInfo";

export default function CompanyDetails() {
  const { siret } = useParams<{ siret: string }>();

  const { data, loading, error } = useQuery<
    Pick<Query, "myCompanies">,
    QueryMyCompaniesArgs
  >(MY_COMPANIES, {
    fetchPolicy: "network-only",
    variables: { search: siret }
  });

  if (error) {
    return <NotificationError apolloError={error} />;
  }

  if (loading) {
    return <Loader />;
  }

  const companies = data?.myCompanies?.edges.map(({ node }) => node);
  const company = companies && companies[0];

  if (!company) {
    return <Navigate to={{ pathname: routes.companies.index }} />;
  }

  const isAdmin = company.userRole === UserRole.Admin;

  return (
    <AccountContentWrapper
      title={`${company.name}${
        company.givenName ? " - " + company.givenName : ""
      }`}
      subtitle={company.orgId}
      additional={userRole(company.userRole!)}
    >
      <div className="fr-tabs" data-testid="company-details">
        <ul
          className="fr-tabs__list"
          role="tablist"
          aria-label="[A modifier | nom du système d'onglet]"
        >
          <li role="presentation">
            <button
              id="tabpanel-404"
              className="fr-tabs__tab fr-icon-checkbox-line fr-tabs__tab--icon-left"
              tabIndex={0}
              role="tab"
              aria-selected="true"
              aria-controls="tabpanel-404-panel"
            >
              Informations
            </button>
          </li>
          <li role="presentation">
            <button
              id="tabpanel-405"
              className="fr-tabs__tab fr-icon-checkbox-line fr-tabs__tab--icon-left"
              tabIndex={-1}
              role="tab"
              aria-selected="false"
              aria-controls="tabpanel-405-panel"
            >
              Signature
            </button>
          </li>
          <li role="presentation">
            <button
              id="tabpanel-406"
              className="fr-tabs__tab fr-icon-checkbox-line fr-tabs__tab--icon-left"
              tabIndex={-1}
              role="tab"
              aria-selected="false"
              aria-controls="tabpanel-406-panel"
            >
              Membres
            </button>
          </li>
          <li role="presentation">
            <button
              id="tabpanel-407"
              className="fr-tabs__tab fr-icon-checkbox-line fr-tabs__tab--icon-left"
              tabIndex={-1}
              role="tab"
              aria-selected="false"
              aria-controls="tabpanel-407-panel"
            >
              Contact
            </button>
          </li>
          {isAdmin && (
            <li role="presentation">
              <button
                id="tabpanel-408"
                className="fr-tabs__tab fr-icon-checkbox-line fr-tabs__tab--icon-left"
                tabIndex={-1}
                role="tab"
                aria-selected="false"
                aria-controls="tabpanel-408-panel"
              >
                Avancé
              </button>
            </li>
          )}
        </ul>
        <div
          id="tabpanel-404-panel"
          className="fr-tabs__panel fr-tabs__panel--selected"
          role="tabpanel"
          aria-labelledby="tabpanel-404"
          tabIndex={0}
        >
          <CompanyInfo company={company} />
          <AccountCompanyInfo company={company} />
        </div>
        <div
          id="tabpanel-405-panel"
          className="fr-tabs__panel"
          role="tabpanel"
          aria-labelledby="tabpanel-405"
          tabIndex={0}
        >
          <AccountCompanySecurity company={company} />
        </div>
        <div
          id="tabpanel-406-panel"
          className="fr-tabs__panel"
          role="tabpanel"
          aria-labelledby="tabpanel-406"
          tabIndex={0}
        >
          <AccountCompanyMemberList company={company} />
        </div>
        <div
          id="tabpanel-407-panel"
          className="fr-tabs__panel"
          role="tabpanel"
          aria-labelledby="tabpanel-407"
          tabIndex={0}
        >
          <CompanyContactForm company={company} />
        </div>
        {isAdmin && (
          <div
            id="tabpanel-408-panel"
            className="fr-tabs__panel"
            role="tabpanel"
            aria-labelledby="tabpanel-408"
            tabIndex={0}
          >
            <CompanyAdvanced company={company} />
          </div>
        )}
      </div>
    </AccountContentWrapper>
  );
}
