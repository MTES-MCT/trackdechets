import React from "react";
import { NavLink, Link } from "react-router-dom";
import { localAuthService } from "./login/auth.service";

export default function Header() {
  return (
    <header className="navbar" role="navigation">
      <div className="navbar__container">
        <Link className="navbar__home" to="/">
          <img
            className="navbar__logo"
            src="/marianne.svg"
            alt="trackdechets.data.gouv.fr"
          />
          Trackdéchets
        </Link>

        <nav>
          <ul className="nav__links">
            <li className="nav__item">
              <NavLink to="/search" activeClassName="active">
                Vérification prestataire
              </NavLink>
            </li>
            {localAuthService.isAuthenticated ? (
              <li className="nav__item">
                <NavLink to="/dashboard/slips" activeClassName="active">
                  Mon espace
                </NavLink>
              </li>
            ) : (
              <li className="nav__item">
                <NavLink to="/login" activeClassName="active">
                  Me connecter
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
