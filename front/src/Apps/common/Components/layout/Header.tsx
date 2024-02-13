import React, { useEffect, useCallback } from "react";
import {
  NavLink,
  Link,
  matchPath,
  useLocation,
  generatePath,
  useNavigate
} from "react-router-dom";

import { localAuthService } from "../../../../login/auth.service";
import { useQuery, gql } from "@apollo/client";
import Loader from "../Loader/Loaders";
import { Query, UserPermission, UserRole } from "@td/codegen-ui";
import { usePermissions } from "../../../../common/contexts/PermissionsContext";
import { useShowTransportTabs } from "../../../Dashboard/hooks/useShowTransportTabs";
import { Button } from "@codegouvfr/react-dsfr/Button";
import DashboardCompanySelector from "../../../../dashboard/DashboardCompanySelector";

import {
  ACTS,
  ALL_BSDS,
  ARCHIVES,
  COLLECTED,
  DRAFTS,
  FOLLOWS,
  REVIEWS,
  TO_COLLECT,
  TRANSPORT,
  TO_REVIEW,
  REVIEWED
} from "../../../common/wordings/dashboard/wordingsDashboard";

import routes from "../../../routes";
import styles from "./Header.module.scss";
import { Header as HeaderDSFR } from "@codegouvfr/react-dsfr/Header";
import { MainNavigation } from "@codegouvfr/react-dsfr/MainNavigation";

export const GET_ME = gql`
  {
    me {
      id
      companies {
        id
        name
        givenName
        userRole
        orgId
        companyTypes
        userPermissions
      }
    }
  }
`;

const MenuLink = ({ entry }) => {
  return entry.navlink ? (
    <NavLink className={`fr-nav__link`} to={entry.href}>
      {entry.caption}
    </NavLink>
  ) : (
    <a
      className={`fr-nav__link`}
      href={entry.href}
      target={entry.target ?? "_self"}
    >
      {entry.caption}
    </a>
  );
};

function DashboardSubNav({ currentCompany }) {
  const { permissions, role } = usePermissions();

  const location = useLocation();

  const matchDashboard = matchPath(
    {
      path: routes.dashboard.index,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchTransportToCollect = matchPath(
    {
      path: routes.dashboard.transport.toCollect,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchTransportCollected = matchPath(
    {
      path: routes.dashboard.transport.collected,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchReviewsToReview = matchPath(
    {
      path: routes.dashboard.bsds.toReview,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchReviewsReviewed = matchPath(
    {
      path: routes.dashboard.bsds.reviewed,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchReviewsTab = !!matchReviewsReviewed || !!matchReviewsToReview;
  const matchTransportTab =
    !!matchTransportCollected || !!matchTransportToCollect;
  const matchDashboardTab =
    !!matchDashboard && !matchReviewsTab && !matchTransportTab;

  const { showTransportTabs } = useShowTransportTabs(
    currentCompany.companyTypes,
    currentCompany.siret
  );

  const showMyBsds =
    permissions.includes(UserPermission.BsdCanList) && role !== UserRole.Driver;

  const showRegisterTab =
    permissions.includes(UserPermission.RegistryCanRead) &&
    [UserRole.Admin, UserRole.Member].includes(role!);

  return (
    <>
      {showMyBsds && (
        <>
          <li className="fr-nav__item">
            <button
              className="fr-nav__btn"
              aria-expanded={false}
              aria-current={matchDashboardTab}
              aria-controls="menu-bordereaux"
            >
              Bordereaux
            </button>
            <div className="fr-collapse fr-menu" id="menu-bordereaux">
              <ul className="fr-menu__list">
                <li>
                  <MenuLink
                    entry={{
                      navlink: true,
                      caption: ALL_BSDS,
                      href: generatePath(routes.dashboard.bsds.index, {
                        siret: currentCompany.orgId
                      })
                    }}
                  />
                </li>
                <li>
                  <MenuLink
                    entry={{
                      navlink: true,
                      caption: DRAFTS,
                      href: generatePath(routes.dashboard.bsds.drafts, {
                        siret: currentCompany.orgId
                      })
                    }}
                  />
                </li>
                <li>
                  <MenuLink
                    entry={{
                      navlink: true,
                      caption: ACTS,
                      href: generatePath(routes.dashboard.bsds.act, {
                        siret: currentCompany.orgId
                      })
                    }}
                  />
                </li>
                <li>
                  <MenuLink
                    entry={{
                      navlink: true,
                      caption: FOLLOWS,
                      href: generatePath(routes.dashboard.bsds.follow, {
                        siret: currentCompany.orgId
                      })
                    }}
                  />
                </li>
                <li>
                  <MenuLink
                    entry={{
                      navlink: true,
                      caption: ARCHIVES,
                      href: generatePath(routes.dashboard.bsds.history, {
                        siret: currentCompany.orgId
                      })
                    }}
                  />
                </li>
              </ul>
            </div>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__btn"
              aria-expanded={false}
              aria-current={matchReviewsTab}
              aria-controls="menu-revisions"
            >
              {REVIEWS}
            </button>
            <div className="fr-collapse fr-menu" id="menu-revisions">
              <ul className="fr-menu__list">
                <li>
                  <MenuLink
                    entry={{
                      navlink: true,
                      caption: TO_REVIEW,
                      href: generatePath(routes.dashboard.bsds.toReview, {
                        siret: currentCompany.orgId
                      })
                    }}
                  />
                </li>
                <li>
                  <MenuLink
                    entry={{
                      navlink: true,
                      caption: REVIEWED,
                      href: generatePath(routes.dashboard.bsds.reviewed, {
                        siret: currentCompany.orgId
                      })
                    }}
                  />
                </li>
              </ul>
            </div>
          </li>
        </>
      )}
      {showTransportTabs && (
        <li className="fr-nav__item">
          <button
            className="fr-nav__btn"
            aria-expanded={false}
            aria-current={matchTransportTab}
            aria-controls="menu-transport"
          >
            {TRANSPORT}
          </button>
          <div className="fr-collapse fr-menu" id="menu-transport">
            <ul className="fr-menu__list">
              <li>
                <MenuLink
                  entry={{
                    navlink: true,
                    caption: TO_COLLECT,
                    href: generatePath(routes.dashboard.transport.toCollect, {
                      siret: currentCompany.orgId
                    })
                  }}
                />
              </li>
              <li>
                <MenuLink
                  entry={{
                    navlink: true,
                    caption: COLLECTED,
                    href: generatePath(routes.dashboard.transport.collected, {
                      siret: currentCompany.orgId
                    })
                  }}
                />
              </li>
            </ul>
          </div>
        </li>
      )}
      {showRegisterTab && (
        <li className="fr-nav__item">
          <MenuLink
            entry={{
              navlink: true,
              caption: "Mes registres",
              href: generatePath(routes.dashboard.exports, {
                siret: currentCompany.orgId
              })
            }}
          />
        </li>
      )}
    </>
  );
}

/**
 *
 * Navigation subset to be included in the moble slidning panel nav
 * Contains main navigation items from the desktop top level nav (Dashboard, Account etc.)
 */
function MobileSubNav({ currentCompany }) {
  const location = useLocation();

  const matchAccount = matchPath(
    {
      path: routes.account.index,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  let dashboardSubNav;

  if (!currentCompany) {
    dashboardSubNav = null;
  } else {
    dashboardSubNav = <DashboardSubNav currentCompany={currentCompany} />;
  }

  return (
    <div
      className={`${styles.headerMobile} fr-header__menu fr-modal`}
      id="header-menu-modal-fr-header-simple-header"
      aria-labelledby="fr-header-simple-header-menu-button"
      data-fr-js-modal="true"
      data-fr-js-header-modal="true"
      aria-modal="true"
      role="dialog"
    >
      <div className="fr-container">
        <button
          id="fr-header-simple-header-mobile-overlay-button-close"
          className="fr-btn--close fr-btn"
          aria-controls="header-menu-modal-fr-header-simple-header"
          title="Fermer"
          data-fr-js-modal-button="true"
        >
          Fermer
        </button>

        <nav
          id="fr-header-simple-header-main-navigation"
          className="fr-nav"
          role="navigation"
          aria-label="Navigation mobile"
          data-fr-js-navigation="true"
        >
          <ul className="fr-nav__list">
            {dashboardSubNav}

            <li className="fr-nav__item">
              <MenuLink
                entry={{
                  navlink: true,
                  caption: "Mes établissements",
                  href: routes.companies.index
                }}
              />
            </li>

            <li className="fr-nav__item">
              <button
                className="fr-nav__btn"
                aria-expanded={false}
                aria-current={!!matchAccount}
                aria-controls="menu-compte"
              >
                Mon compte
              </button>
              <div className="fr-collapse fr-menu" id="menu-compte">
                <ul className="fr-menu__list">
                  <li>
                    <MenuLink
                      entry={{
                        navlink: true,
                        caption: "Informations générales",
                        href: routes.account.info
                      }}
                    />
                  </li>
                  <li>
                    <MenuLink
                      entry={{
                        navlink: true,
                        caption: "Jetons d'accès API",
                        href: routes.account.tokens.list
                      }}
                    />
                  </li>
                  <li>
                    <MenuLink
                      entry={{
                        navlink: true,
                        caption: "Application autorisées",
                        href: routes.account.authorizedApplications
                      }}
                    />
                  </li>
                  <li>
                    <MenuLink
                      entry={{
                        navlink: true,
                        caption: "Mes applications",
                        href: routes.account.oauth2.list
                      }}
                    />
                  </li>
                </ul>
              </div>
            </li>
            <li className="fr-nav__item">
              <a
                className="fr-nav__link"
                href="https://faq.trackdechets.fr/"
                target="_blank"
                rel="noreferrer"
              >
                Aide
              </a>
            </li>
            <li className="fr-nav__item">
              <button
                className="fr-nav__link"
                onClick={() => {
                  localAuthService.locallySignOut();
                  document.forms["logout"].submit();
                  return false;
                }}
              >
                Déconnexion
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

const getDesktopMenuEntries = (isAuthenticated, isAdmin, currentSiret) => {
  const common = [
    {
      caption: "Aide",
      href: "https://faq.trackdechets.fr/",
      navlink: null,
      target: "_blank"
    }
  ];

  const admin = [
    {
      caption: "Admin",
      href: routes.admin.verification,
      navlink: true
    }
  ];

  const connected = [
    {
      caption: "Mes bordereaux",
      href: currentSiret
        ? generatePath(routes.dashboard.index, {
            siret: currentSiret
          })
        : "/",

      navlink: true
    },
    {
      caption: "Mes établissements",
      href: routes.companies.index,

      navlink: true
    },
    {
      caption: "Mon compte",
      href: routes.account.index,

      navlink: true
    }
  ];

  return [
    ...(isAuthenticated ? connected : []),
    ...common,
    ...(isAdmin ? admin : [])
  ];
};

type HeaderProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  defaultOrgId?: string;
};

/**
 * Main nav
 * Contains External and internal links
 * On mobile appear as a sliding panel and includes other items
 */
export default function Header({
  isAuthenticated,
  isAdmin,
  defaultOrgId
}: HeaderProps) {
  const { VITE_API_ENDPOINT } = import.meta.env;
  const location = useLocation();
  const { updatePermissions, role } = usePermissions();
  const navigate = useNavigate();

  const matchDashboard = matchPath(
    {
      path: routes.dashboard.index,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  // Catching siret from url when not available from props (just after login)
  const currentSiret = matchDashboard?.params["siret"] || defaultOrgId;

  const { data } = useQuery<Pick<Query, "me">>(GET_ME);

  useEffect(() => {
    if (isAuthenticated && data && currentSiret) {
      const companies = data.me.companies;
      const currentCompany = companies.find(
        company => company.orgId === currentSiret
      );
      if (currentCompany) {
        updatePermissions(
          currentCompany.userPermissions,
          currentCompany.userRole!
        );
      }
    }
  }, [updatePermissions, data, currentSiret, isAuthenticated]);

  const handleCompanyChange = useCallback(
    orgId => {
      navigate(
        generatePath(
          role?.includes(UserRole.Driver)
            ? routes.dashboard.transport.toCollect
            : routes.dashboard.bsds.index,
          {
            siret: orgId
          }
        )
      );
    },
    [navigate, role]
  );

  if (isAuthenticated && data?.me == null) {
    return <Loader />;
  }
  const companies = data?.me.companies;

  const currentCompany = companies?.find(
    company => company.orgId === currentSiret
  );

  const menuEntries = getDesktopMenuEntries(
    isAuthenticated,
    isAdmin,
    currentSiret
  );

  return !isAuthenticated ? (
    <HeaderDSFR
      brandTop={
        <>
          Ministère
          <br />
          de la transition
          <br />
          écologique
        </>
      }
      homeLinkProps={{
        href: "/",
        title: "Accueil - Trackdéchets"
      }}
      id="fr-header-with-horizontal-operator-logo"
      operatorLogo={{
        alt: "Trackdéchets",
        imgUrl: "./trackdechets-small.png",
        orientation: "horizontal"
      }}
      quickAccessItems={[
        {
          iconId: "fr-icon-arrow-right-line",
          linkProps: {
            href: routes.signup.index
          },
          text: "Créer mon compte"
        },
        {
          iconId: "fr-icon-account-circle-line",
          linkProps: {
            href: routes.login,
            className: "fr-btn fr-btn--secondary fr-btn--sm  fr-btn--icon-right"
          },
          text: "Se connecter"
        }
      ]}
      serviceTagline="Gérer la traçabilité des déchets en toute sécurité"
      serviceTitle="Trackdéchets"
      navigation={
        <MainNavigation
          items={[
            {
              linkProps: {
                href: "https://faq.trackdechets.fr/",
                target: "_blank"
              },
              text: "Aide"
            }
          ]}
        />
      }
    />
  ) : (
    <>
      <div id="header" className={`fr-header ${styles.header}`}>
        <div className={styles.headerContent}>
          <div className={`fr-enlarge-link ${styles.headerBranding}`}>
            <Link to="/">
              <img
                src="/marianne.svg"
                alt=""
                style={{ height: "40px", width: "40px", marginRight: "24px" }}
              />

              <img
                src="/trackdechets.png"
                alt="trackdechets.data.gouv.fr"
                style={{ height: "40px", width: "40px" }}
              />
            </Link>
          </div>

          <nav className={`fr-nav ${styles.headerNav}`}>
            <ul
              className={`fr-nav__list`}
              style={{ margin: "initial", maxWidth: "initial" }}
            >
              {menuEntries.map((e, idx) => (
                <li className="fr-nav__item" key={idx}>
                  <MenuLink entry={e} />
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.headerActions}>
            <form
              name="logout"
              action={`${VITE_API_ENDPOINT}/logout`}
              method="post"
            >
              <Button
                iconId="fr-icon-logout-box-r-line"
                onClick={() => {
                  localAuthService.locallySignOut();
                  document.forms["logout"].submit();
                  return false;
                }}
                priority="tertiary no outline"
                title="Se déconnecter"
              />
            </form>
          </div>

          <button
            className={`fr-btn fr-btn--tertiary fr-icon-menu-fill ${styles.headerToggle}`}
            data-fr-opened="false"
            aria-controls="header-menu-modal-fr-header-simple-header"
            aria-haspopup="menu"
            id="fr-header-simple-header-menu-button"
            title="Menu"
            data-fr-js-modal-button="true"
          >
            Menu
          </button>
        </div>

        <MobileSubNav currentCompany={currentCompany} />
      </div>

      {/* Company switcher on top of the page */}
      {!!matchDashboard && companies && currentCompany && (
        <div className={styles.companySelector}>
          {companies.length > 1 ? (
            <div className="company-select">
              <DashboardCompanySelector
                orgId={currentCompany.orgId}
                companies={companies}
                handleCompanyChange={handleCompanyChange}
              />
            </div>
          ) : (
            <div className="company-title">{currentCompany.name}</div>
          )}
        </div>
      )}
    </>
  );
}
