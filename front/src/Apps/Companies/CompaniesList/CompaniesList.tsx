import React, { useState } from "react";
import { Link, useNavigate, generatePath } from "react-router-dom";
import {
  CompanyPrivate,
  UserRole,
  CompanyPrivateConnection
} from "@td/codegen-ui";
import routes from "../../routes";
import styles from "./CompaniesList.module.scss";
import AccountContentWrapper from "../../Account/AccountContentWrapper";
import DropdownMenu from "../../common/Components/DropdownMenu/DropdownMenu";
import {
  useDownloadMyCompaniesCsv,
  useDownloadMyCompaniesXls
} from "../common/hooks/useDownloadCompanies";
import SearchableCompaniesList from "./SearchableCompaniesList";

export const userRole = (role: UserRole) => {
  let icon = "fr-icon-user-line";
  let roleLabel = "";

  switch (role) {
    case UserRole.Admin:
      icon = "fr-icon-admin-line";
      roleLabel = "Administrateur";
      break;
    case UserRole.Driver:
      roleLabel = "Chauffeur";
      break;
    case UserRole.Member:
      roleLabel = "Collaborateur";
      break;
    case UserRole.Reader:
      roleLabel = "Lecteur";
      break;
  }

  return (
    <>
      <span className={`${styles.icon} ${icon}`} aria-hidden="true" />
      {roleLabel}
    </>
  );
};

export default function CompaniesList() {
  const navigate = useNavigate();
  const [downloadMyCompaniesCsv] = useDownloadMyCompaniesCsv();
  const [downloadMyCompaniesXls] = useDownloadMyCompaniesXls();
  const [companiesTotalCount, setCompaniesTotalCount] = useState<null | number>(
    null
  );

  const pluralize = count => (count > 1 ? "s" : "");

  const onMyCompaniesQueryCompleted = (
    data: CompanyPrivateConnection,
    isFiltered: boolean
  ) => {
    if (!isFiltered) {
      if (data.totalCount === 0) {
        // No results and we're not filtering, redirect to the create company screen
        navigate(routes.companies.orientation);
      }
      setCompaniesTotalCount(data.totalCount);
    }
  };

  const renderCompanies = (companies: CompanyPrivate[]) => {
    return (
      <div>
        {companies.map(company => (
          <Link
            to={{
              pathname: generatePath(routes.companies.details, {
                siret: company.orgId
              })
            }}
            className={styles.item}
            key={company.orgId}
          >
            <div data-testid="companies-list">
              <p className={`fr-text ${styles.name}`}>
                {company.name}
                {company.givenName && ` - ${company.givenName}`}
              </p>
              <p className="fr-text">{company.orgId}</p>
              <p className="fr-text">{company.address}</p>
              <p className={`${styles.role} fr-text`}>
                {userRole(company.userRole!)}
              </p>
            </div>
            <span
              className={`fr-icon-arrow-down-s-line ${styles.arrow}`}
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    );
  };

  const subtitle = companiesTotalCount
    ? `Vous êtes membre de ${companiesTotalCount} établissement${pluralize(
        companiesTotalCount
      )}`
    : "";

  return (
    <AccountContentWrapper
      title="Établissements"
      subtitle={subtitle}
      additional={
        <>
          <Link className="fr-btn fr-mr-1w" to={routes.companies.orientation}>
            <span id="create-company-link">Créer un établissement</span>
          </Link>
          <DropdownMenu
            menuTitle="Exporter la liste"
            links={[
              {
                title: "Format .XLS",
                isButton: true,
                iconId: "fr-icon-download-line",
                handleClick: () => downloadMyCompaniesXls()
              },
              {
                title: "Format .CSV",
                isButton: true,
                iconId: "fr-icon-download-line",
                handleClick: () => downloadMyCompaniesCsv()
              }
            ]}
            iconId="fr-icon-download-line"
          />
        </>
      }
    >
      <SearchableCompaniesList
        renderCompanies={renderCompanies}
        onCompleted={onMyCompaniesQueryCompleted}
      />
    </AccountContentWrapper>
  );
}
