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

const fieldErrorsProps = (fieldName, errorField) => {
  if (errorField === fieldName) {
    return {
      autoFocus: true,
      style: { border: "1px solid red" },
    };
  }
  return {};
};
export default withRouter(function Login(
  routeProps: RouteComponentProps<
    {},
    {},
    {
      error?: string;
      errorField?: string;
      returnTo?: string;
      username?: string;
    }
  >
) {
  const { REACT_APP_API_ENDPOINT } = process.env;

  const queries = queryString.parse(routeProps.location.search);

  if (queries.error || queries.returnTo) {
    const { error, errorField, returnTo, username } = queries;
    const state = {
      ...(queries.error ? { error, errorField, username } : {}),
      ...(!!returnTo ? { returnTo } : {}),
    };

    return <Redirect to={{ pathname: "/login", state }} />;
  }

  const { returnTo, error, errorField, username } =
    routeProps.location.state || {};

  return (
    <section className="section section--white">
      <div className={`${styles.loginContainer} container`}>
        <form
          action={`${REACT_APP_API_ENDPOINT}/login`}
          method="post"
          name="login"
        >
          <h1 className="h1 tw-mb-6">Connexion</h1>
          <div className="form__row">
            <label>
              Email
              <input
                type="email"
                name="email"
                defaultValue={username}
                className="td-input"
                {...fieldErrorsProps("email", errorField)}
              />
            </label>
            {error && errorField === "email" && (
              <div className="error-message">{error}</div>
            )}
          </div>

          <div className="form__row">
            <label>
              Mot de passe
              <input
                type="password"
                name="password"
                className="td-input"
                {...fieldErrorsProps("password", errorField)}
              />
            </label>
            {error && errorField === "password" && (
              <div className="error-message">{error}</div>
            )}
          </div>
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          {error && !errorField && (
            <div className="error-message">{error}</div>
          )}
          <div className="form__actions">
            <button
              className="btn btn--primary"
              type="submit"
              onClick={() => {
                localAuthService.locallySignOut();
                document.forms["login"].submit();
              }}
            >
              Se connecter
            </button>
          </div>
          <p className="tw-my-5">
            Vous n'avez pas encore de compte ?{" "}
            <Link to="/signup" className="link">
              Inscrivez vous maintenant
            </Link>
          </p>
          <p className="tw-my-5">
            Vous avez perdu votre mot de passe ?{" "}
            <Link to="/reset-password" className="link">
              Réinitialisez le
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
});
