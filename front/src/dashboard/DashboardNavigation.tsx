import React from "react";
import { NavLink, useHistory } from "react-router-dom";

import Loader from "src/common/components/Loaders";
import { InlineError } from "src/common/components/Error";
import DashboardCompanySelector from "src/dashboard/DashboardCompanySelector";
import getDashboardRoutes from "src/common/routes";
import { CompanyType } from "src/generated/graphql/types";
import styles from "./DashboardNavigation.module.scss";

export function DashboardNav({
  currentSiret,
  onClick,
  loading,
  error,
  data,
}: {
  currentSiret: string;
  onClick: () => void;
  loading: boolean;
  error: any;
  data: any;
}) {
  const history = useHistory();

  if (loading) return <Loader />;
  if (error) return <InlineError apolloError={error} />;
  const companies = data?.me.companies || [];
  const company = companies.find(c => c.siret === currentSiret);
  const routes = getDashboardRoutes({ siret: currentSiret, company: company });

  const handleCompanyChange = () => history.push(routes.dashboard);

  return (
    <>
      {companies.length > 1 ? (
        <div className={styles.companySelect}>
          <DashboardCompanySelector
            siret={currentSiret}
            companies={companies}
            handleCompanyChange={siret => history.push(`/dashboard/${siret}`)}
          />
        </div>
      ) : (
        <div className={styles.dashboardNavCompanyTitle}>{company?.name}</div>
      )}

      {company && (
        <>
          <p className={styles.dashboardNavChapter}>Mes bordereaux</p>
          <ul>
            <li className="sidebar__item">
              <NavLink
                to={routes.draft}
                className={`${styles.dashboardNavLink} ${styles.dashboardNavIndented}`}
                activeClassName="sidebar__link--active"
                onClick={() => onClick()}
              >
                Brouillon
              </NavLink>
            </li>

            <li>
              <NavLink
                to={routes.forAction}
                className={`${styles.dashboardNavLink} ${styles.dashboardNavIndented}`}
                activeClassName="sidebar__link--active"
                onClick={() => onClick()}
              >
                Pour action
              </NavLink>
            </li>

            <li>
              <NavLink
                to={routes.followUp}
                className={`${styles.dashboardNavLink} ${styles.dashboardNavIndented}`}
                activeClassName="sidebar__link--active"
                onClick={() => onClick()}
              >
                Suivi
              </NavLink>
            </li>
            <li>
              <NavLink
                to={routes.archive}
                className={`${styles.dashboardNavLink} ${styles.dashboardNavIndented}`}
                activeClassName="sidebar__link--active"
                onClick={() => onClick()}
              >
                Archivé
              </NavLink>
            </li>
          </ul>
          {company.companyTypes.includes(CompanyType.Transporter) && (
            <>
              <p className={styles.dashboardNavChapter}>Transport</p>
              <ul>
                <li>
                  <NavLink
                    to={routes["transportToCollect"]}
                    className={`${styles.dashboardNavLink} ${styles.dashboardNavIndented}`}
                    activeClassName="sidebar__link--active"
                    onClick={() => onClick()}
                  >
                    À collecter
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={routes["transportCollected"]}
                    className={`${styles.dashboardNavLink} ${styles.dashboardNavIndented}`}
                    activeClassName="sidebar__link--active"
                    onClick={() => onClick()}
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
                to={routes.exports}
                className={`${styles.dashboardNavLink} ${styles.dashboardNavMain}`}
                activeClassName={styles.dashboardNavActive}
                onClick={() => onClick()}
              >
                Registre
              </NavLink>
            </li>
            <li>
              <NavLink
                to={routes.stats}
                className={`${styles.dashboardNavLink} ${styles.dashboardNavMain}`}
                activeClassName={styles.dashboardNavActive}
                onClick={() => onClick()}
              >
                Statistiques
              </NavLink>
            </li>
          </ul>
        </>
      )}
    </>
  );
}
