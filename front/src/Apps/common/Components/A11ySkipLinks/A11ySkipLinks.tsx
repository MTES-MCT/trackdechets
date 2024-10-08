import { MEDIA_QUERIES } from "../../../../common/config";
import { useMedia } from "../../../../common/use-media";
import routes from "../../../routes";
import React, { useRef } from "react";
import { matchPath, useLocation } from "react-router-dom";

const A11ySkipLinks = () => {
  const location = useLocation();
  const links = useRef<{ title; callback }[]>([]);
  const isMobile = useMedia(`(max-width: ${MEDIA_QUERIES.handHeld})`);

  const matchDashboard = matchPath(
    {
      path: routes.dashboard.index,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchCompanies = matchPath(
    {
      path: routes.companies.index,
      caseSensitive: false,
      end: true
    },
    location.pathname
  );
  const matchCompanyDetails = matchPath(
    {
      path: routes.companies.details,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );
  const matchRegistry = matchPath(
    {
      path: routes.registry,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );
  const matchAccount = matchPath(
    {
      path: routes.account.info,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );
  const matchAdmin = matchPath(
    {
      path: routes.admin.verification,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchSignIn = matchPath(
    {
      path: routes.login,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  const matchSignUp = matchPath(
    {
      path: routes.signup.index,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );
  const matchPasswordResetRequest = matchPath(
    {
      path: routes.passwordResetRequest,
      caseSensitive: false,
      end: false
    },
    location.pathname
  );

  if (matchSignIn || matchSignUp || matchPasswordResetRequest) {
    links.current = [
      {
        title: "Contenu",
        callback: () => {
          matchSignUp
            ? document.getElementById("fullnameSignUp")?.focus()
            : document.getElementsByName("email")?.[0]?.focus();
        }
      }
    ];
  } else {
    links.current = [
      {
        title: "Menu principal",
        callback: () => {
          // @ts-ignore
          document.getElementById("header-all-bsds-link")?.firstChild?.focus();
        }
      },
      {
        title: "Menu secondaire",
        callback: () => {
          if (matchDashboard) {
            //dashboard company switcher
            document
              .getElementById("company-dashboard-select")
              //@ts-ignore
              ?.firstChild?.firstChild?.focus();
          } else {
            //first accordion element
            document
              .getElementById("td-sidebar")
              //@ts-ignore
              ?.firstChild?.firstChild?.firstChild?.focus();
          }
        }
      },
      {
        title: "Contenu",
        callback: () => {
          if (matchDashboard) {
            document.getElementById("create-bsd-btn")?.focus();
          }
          if (matchCompanies) {
            // @ts-ignore
            document.getElementById("create-company-link")?.parentNode?.focus();
          }
          if (matchCompanyDetails) {
            document.getElementById("company-tab-content")?.focus();
          }
          if (matchRegistry) {
            document.getElementsByName("exportType")?.[0]?.focus();
          }
          if (matchAccount) {
            document.getElementById("account-info")?.focus();
          }
          if (matchAdmin) {
            document.getElementById("admin-content")?.focus();
          }
        }
      }
    ];
  }
  if (isMobile) return null;

  return (
    <div className="fr-skiplinks">
      <nav className="fr-container" role="navigation" aria-label="Accès rapide">
        <ul className="fr-skiplinks__list">
          {links?.current?.map(link => (
            <li key={link.title}>
              <button className="fr-link" onClick={link.callback}>
                {link.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default A11ySkipLinks;
