import React from "react";
import queryString from "query-string";
import {
  Link,
  RouteComponentProps,
  withRouter,
  Redirect,
} from "react-router-dom";
import styles from "./Login.module.scss";
import { localAuthService } from "./auth.service";

export default withRouter(function Login(
  routeProps: RouteComponentProps<{}, {}, { error?: string; returnTo?: string }>
) {
  const { REACT_APP_API_ENDPOINT } = process.env;

  const queries = queryString.parse(routeProps.location.search);

  if (queries.error || queries.returnTo) {
    const state = {
      ...(queries.error ? { error: queries.error } : {}),
      ...(queries.returnTo ? { returnTo: queries.returnTo } : {}),
    };
    return <Redirect to={{ pathname: "/login", state }} />;
  }

  const { returnTo, error } = routeProps.location.state || {};

  return (
    <section className="section section-white">
      <div className="container">
        <form
          action={`${REACT_APP_API_ENDPOINT}/login`}
          method="post"
          name="login"
        >
          <h1>Connexion</h1>
          <div className="form__group">
            <label>
              Email
              <input type="email" name="email" />
            </label>
          </div>

          <div className="form__group">
            <label>
              Mot de passe
              <input type="password" name="password" />
            </label>
          </div>

          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

          {error && <div className={styles["form-error-message"]}>{error}</div>}

          <button
            className="button"
            type="submit"
            onClick={() => {
              localAuthService.locallySignOut();
              document.forms["login"].submit();
            }}
          >
            Se connecter
          </button>
          <p>
            Vous n'avez pas encore de compte ?{" "}
            <Link to="/signup">Inscrivez vous maintenant</Link>
          </p>
          <p>
            Vous avez perdu votre mot de passe ?{" "}
            <Link to="/reset-password">Réinitialisez le</Link>
          </p>
        </form>
      </div>
    </section>
  );
});
