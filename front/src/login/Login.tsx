import routes from "common/routes";
import * as queryString from "query-string";
import React from "react";
import { Link, Redirect, useLocation } from "react-router-dom";
import { localAuthService } from "./auth.service";

function getErrorMessage(errorCode: string) {
  if (errorCode === "NOT_ACTIVATED") {
    return "Ce compte n'a pas encore été activé. Vérifiez vos emails ou contactez le support";
  }

  return "Email ou mot de passe incorrect";
}

export default function Login() {
  const location = useLocation<{
    errorCode?: string;
    returnTo?: string;
    username?: string;
  }>();

  const { VITE_API_ENDPOINT } = import.meta.env;

  const queries = queryString.parse(location.search);

  if (queries.errorCode || queries.returnTo) {
    const { errorCode, returnTo, username } = queries;
    const state = {
      ...(queries.errorCode ? { errorCode, username } : {}),
      ...(!!returnTo ? { returnTo } : {}),
    };

    return <Redirect to={{ pathname: routes.login, state }} />;
  }

  const { returnTo, errorCode, username } = location.state || {};

  return (
    <section className="section section--white">
      <div className="container-narrow">
        <form action={`${VITE_API_ENDPOINT}/login`} method="post" name="login">
          <h1 className="h1 tw-mb-6">Connexion</h1>
          <div className="form__row">
            <label>
              Email
              <input
                type="email"
                name="email"
                defaultValue={username}
                className="td-input"
              />
            </label>
          </div>

          <div className="form__row">
            <label>
              Mot de passe
              <input type="password" name="password" className="td-input" />
            </label>
          </div>
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          {errorCode && (
            <div className="error-message">{getErrorMessage(errorCode)}</div>
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
            <Link to={routes.signup.index} className="link">
              Inscrivez vous maintenant
            </Link>
          </p>
          <p className="tw-my-5">
            Vous n'avez pas reçu d'email d'activation suite à votre inscription
            ?{" "}
            <Link to={routes.resendActivationEmail} className="link">
              Renvoyez l'email d'activation
            </Link>
          </p>
          <p className="tw-my-5">
            Vous avez perdu votre mot de passe ?{" "}
            <Link to={routes.passwordResetRequest} className="link">
              Réinitialisez le
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
