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
  REVIEWED,
  RETURNS
} from "../../../common/wordings/dashboard/wordingsDashboard";

import routes from "../../../routes";
import styles from "./Header.module.scss";
import CompanySwitcher from "../CompanySwitcher/CompanySwitcher";

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
        securityCode
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

  const showRegistryTab =
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
              <li>
                <MenuLink
                  entry={{
                    navlink: true,
                    caption: RETURNS,
                    href: generatePath(routes.dashboard.transport.returns, {
                      siret: currentCompany.orgId
                    })
                  }}
                />
              </li>
            </ul>
          </div>
        </li>
      )}
      {showRegistryTab && (
        <li className="fr-nav__item">
          <MenuLink
            entry={{
              navlink: true,
              caption: "Mes registres",
              href: routes.registry
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
                        caption: "Mes paramètres",
                        href: routes.account.info
                      }}
                    />
                  </li>
                  <li>
                    <MenuLink
                      entry={{
                        navlink: true,
                        caption: "Applications et API",
                        href: routes.account.applications
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

const getDesktopMenuEntries = (
  isAuthenticated,
  isAdmin,
  showRegistry,
  currentSiret
) => {
  const admin = [
    {
      caption: "Admin",
      href: routes.admin.verification,
      navlink: true
    }
  ];

  const registry = [
    {
      caption: "Mes registres",
      href: routes.registry,
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
    ...(showRegistry ? registry : []),
    {
      caption: "Mon compte",
      href: routes.account.index,

      navlink: true
    }
  ];

  return [...(isAuthenticated ? connected : []), ...(isAdmin ? admin : [])];
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
  const { updatePermissions, role, permissions } = usePermissions();
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
          currentCompany.userRole!,
          currentSiret
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

  const showRegistry =
    permissions.includes(UserPermission.RegistryCanRead) &&
    [UserRole.Admin, UserRole.Member].includes(role!);

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
    showRegistry,
    currentSiret
  );

  return !isAuthenticated ? (
    <header
      role="banner"
      id="fr-header-with-horizontal-operator-logo"
      className="fr-header"
    >
      <div className="fr-header__body">
        <div className="fr-container">
          <div className="fr-header__body-row">
            <div className="fr-header__brand fr-enlarge-link">
              <div className="fr-header__brand-top">
                <div className="fr-header__logo">
                  <p className="fr-logo">
                    Ministère
                    <br />
                    de la transition
                    <br />
                    écologique
                  </p>
                </div>
                <div className="fr-header__operator">
                  <img
                    className="fr-responsive-img"
                    style={{ width: "70px", height: "70px" }}
                    src="./trackdechets.png"
                    alt="Trackdéchets"
                    data-fr-js-ratio="true"
                  />
                </div>
                <div className="fr-header__navbar">
                  <button
                    className="fr-btn--menu fr-btn"
                    data-fr-opened="false"
                    aria-controls="header-menu-modal-fr-header-with-horizontal-operator-logo"
                    aria-haspopup="menu"
                    id="fr-header-with-horizontal-operator-logo-menu-button"
                    title="Menu"
                    data-fr-js-modal-button="true"
                  >
                    Menu
                  </button>
                </div>
              </div>
              <div className="fr-header__service">
                <a href="/" title="Accueil - Trackdéchets">
                  <p className="fr-header__service-title">Trackdéchets</p>
                </a>
                <p className="fr-header__service-tagline">
                  Gérer la traçabilité des déchets en toute sécurité
                </p>
              </div>
            </div>
            <div className="fr-header__tools">
              <div
                className="fr-header__tools-links"
                data-fr-js-header-links="true"
              >
                <ul className="fr-btns-group">
                  <li>
                    <a
                      href="/signup"
                      className="fr-btn fr-icon-arrow-right-line"
                    >
                      Créer mon compte
                    </a>
                  </li>
                  <li>
                    <a
                      href="/login"
                      className="fr-btn fr-icon-account-circle-line fr-btn fr-btn--secondary fr-btn--sm fr-btn--icon-right"
                    >
                      Se connecter
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="fr-header__menu fr-modal"
        id="header-menu-modal-fr-header-with-horizontal-operator-logo"
        aria-labelledby="fr-header-with-horizontal-operator-logo-menu-button"
        data-fr-js-modal="true"
        data-fr-js-header-modal="true"
      >
        <div className="fr-container">
          <button
            id="fr-header-with-horizontal-operator-logo-mobile-overlay-button-close"
            className="fr-btn--close fr-btn"
            aria-controls="header-menu-modal-fr-header-with-horizontal-operator-logo"
            title="Fermer"
            data-fr-js-modal-button="true"
          >
            Fermer
          </button>
          <div className="fr-header__menu-links">
            <ul className="fr-btns-group">
              <li>
                <a href="/signup" className="fr-btn fr-icon-arrow-right-line">
                  Créer mon compte
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="fr-btn fr-icon-account-circle-line fr-btn fr-btn--secondary fr-btn--sm  fr-btn--icon-right"
                >
                  Se connecter
                </a>
              </li>
            </ul>
          </div>
          <nav
            id="main-navigation"
            className="fr-nav"
            role="navigation"
            aria-label="Menu principal"
            data-fr-js-navigation="true"
          >
            <ul className="fr-nav__list">
              <li className="fr-nav__item" data-fr-js-navigation-item="true">
                <button
                  className="fr-nav__btn"
                  aria-expanded="false"
                  aria-controls="main-navigation-menu-aide"
                  data-fr-js-collapse-button="true"
                >
                  Aide
                </button>
                <div
                  className="fr-menu fr-collapse"
                  id="main-navigation-menu-aide"
                  data-fr-js-collapse="true"
                >
                  <ul className="fr-menu__list">
                    <li>
                      <a
                        href="https://faq.trackdechets.fr/"
                        target="_blank"
                        rel="noreferrer"
                        className="fr-nav__link"
                      >
                        Foire aux questions
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://sandbox.trackdechets.beta.gouv.fr/"
                        target="_blank"
                        rel="noreferrer"
                        className="fr-nav__link"
                      >
                        Site de démonstration
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://trackdechets.beta.gouv.fr/"
                        target="_blank"
                        rel="noreferrer"
                        className="fr-nav__link"
                      >
                        Page d'accueil / Formations
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
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

              <li className="fr-nav__item">
                <button
                  className="fr-nav__btn"
                  aria-expanded="false"
                  aria-controls="aidemenu"
                >
                  Aide
                </button>
                <div className="fr-collapse fr-menu" id="aidemenu">
                  <ul className="fr-menu__list">
                    <li>
                      <a
                        className="fr-nav__link"
                        href="https://faq.trackdechets.fr/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Foire aux questions
                      </a>
                    </li>
                    <li>
                      <a
                        className="fr-nav__link"
                        href="https://sandbox.trackdechets.beta.gouv.fr/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Site de démonstration
                      </a>
                    </li>
                    <li>
                      <a
                        className="fr-nav__link"
                        href="https://trackdechets.beta.gouv.fr/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Page d'accueil / Formations
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
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
          <div className="company-select">
            <CompanySwitcher
              currentOrgId={currentCompany.orgId}
              companies={companies}
              handleCompanyChange={handleCompanyChange}
            />
          </div>
        </div>
      )}
    </>
  );
}
