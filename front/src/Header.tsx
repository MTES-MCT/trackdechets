import React from "react";
import { Link } from "react-router-dom";
import { localAuthService } from "./login/auth.service";

export default function Header() {
  return (
    <header className="navbar" role="navigation">
      <div className="navbar__container">
        <a className="navbar__home" href="index.html">
          <img
            className="navbar__logo"
            src="/marianne.svg"
            alt="trackdechets.data.gouv.fr"
          />
          Trackdéchets
        </a>

        <nav>
          <ul className="nav__links">
            {localAuthService.isAuthenticated ? (
              <li className="nav__item">
                <Link to="/dashboard/slips">Mon espace</Link>
              </li>
            ) : (
              <li className="nav__item">
                <Link to="/login">Me connecter</Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
