import React from "react";
import {
  NavLink,
  Link,
  withRouter,
  RouteComponentProps
} from "react-router-dom";
import { trackEvent } from "./tracker";
import "./Header.scss";
import { localAuthService } from "./login/auth.service";

type Props = {
  isAuthenticated: boolean;
};

export default withRouter(function Header({
  history,
  isAuthenticated
}: RouteComponentProps & Props) {
  const { REACT_APP_API_ENDPOINT, REACT_APP_DOC_ENDPOINT } = process.env;

  return (
    <header className="navbar" role="navigation">
      <div className="navbar__container">
        <Link className="navbar__home" to="/">
          <img
            className="navbar__logo"
            src="/trackdechets.png"
            alt="trackdechets.data.gouv.fr"
          />
        </Link>

        <nav>
          <ul className="nav__links">
            <li className="nav__item">
              {/* <NavLink
                to="/faq"
                activeClassName="active"
                onClick={() => trackEvent("navbar", "faq")}
              >
                FAQ
              </NavLink> */}
              <a href={REACT_APP_DOC_ENDPOINT}>Développeurs</a>
              <a href="https://faq.trackdechets.fr/"> FAQ</a>
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
                    to="/dashboard/slips"
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
