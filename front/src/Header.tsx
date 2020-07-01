import React from "react";
import {
  NavLink,
  Link,
  withRouter,
  RouteComponentProps,
} from "react-router-dom";
import { trackEvent } from "./tracker";
import "./Header.scss";
import { localAuthService } from "./login/auth.service";
import { currentSiretService } from "./dashboard/CompanySelector";

type Props = {
  isAuthenticated: boolean;
};

export default withRouter(function Header({
  isAuthenticated,
}: RouteComponentProps & Props) {
  const { REACT_APP_API_ENDPOINT, REACT_APP_DEVELOPERS_ENDPOINT } = process.env;

  return (
    <header className="navbar" role="navigation">
      <div className="navbar__container">
        <div className="navbar__branding">
          <img
            className="navbar__marianne"
            src="/marianne.svg"
            alt="Ministère de la Transition écologique et solidaire"
          />
          <Link className="navbar__home" to="/">
            <img
              className="navbar__logo"
              src="/trackdechets.png"
              alt="trackdechets.data.gouv.fr"
            />
          </Link>
        </div>
        <nav>
          <ul className="nav__links">
            <li className="nav__item">
              <a href={REACT_APP_DEVELOPERS_ENDPOINT}>Développeurs</a>
              <a
                href="https://faq.trackdechets.fr/"
                onClick={() => trackEvent("navbar", "faq")}
              >
                FAQ
              </a>
            </li>
            <li className="nav__item">
              <NavLink
                to="/partners"
                activeClassName="active"
                onClick={() => trackEvent("navbar", "partners")}
              >
                Partenaires
              </NavLink>
            </li>
            <li className="nav__item" role="separator">
              |
            </li>
            {isAuthenticated ? (
              <>
                <li className="nav__item">
                  <NavLink
                    to={`/dashboard/${currentSiretService.getSiret()}`}
                    activeClassName="active"
                    onClick={() => trackEvent("navbar", "mon-espace")}
                  >
                    Mon espace
                  </NavLink>
                </li>
                <li className="nav__item">
                  <NavLink
                    activeClassName="active"
                    to="/account/info"
                    onClick={() => trackEvent("navbar", "mon-compte")}
                  >
                    Mon compte
                  </NavLink>
                </li>
                <li className="nav__item logout">
                  <form
                    name="logout"
                    action={`${REACT_APP_API_ENDPOINT}/logout`}
                    method="post"
                  >
                    <button
                      className="link"
                      onClick={() => {
                        localAuthService.locallySignOut();
                        document.forms["logout"].submit();
                        return false;
                      }}
                    >
                      Se déconnecter
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li className="nav__item">
                  <NavLink
                    to="/signup"
                    activeClassName="active"
                    onClick={() => trackEvent("navbar", "signup")}
                  >
                    S'inscrire
                  </NavLink>
                </li>
                <li className="nav__item">
                  <NavLink
                    to="/login"
                    activeClassName="active"
                    onClick={() => trackEvent("navbar", "login")}
                  >
                    Se connecter
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
});
