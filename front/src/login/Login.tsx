import React from "react";
import queryString from "query-string";
import {
  Link,
  RouteComponentProps,
  withRouter,
  Redirect
} from "react-router-dom";
import styles from "./Login.module.scss";

export default withRouter(function Login(
  routeProps: RouteComponentProps<{}, {}, { error: string }>
) {
  const { REACT_APP_API_ENDPOINT } = process.env;

  const queries = queryString.parse(routeProps.location.search);

  if (queries.error) {
    return (
      <Redirect to={{ pathname: "/login", state: { error: queries.error } }} />
    );
  }

  return (
    <section className="section section-white">
      <div className="container">
        <form action={`${REACT_APP_API_ENDPOINT}/login`} method="post">
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

          {routeProps.location.state && (
            <div className={styles["form-error-message"]}>
              {routeProps.location.state.error}
            </div>
          )}

          <button className="button" type="submit">
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
