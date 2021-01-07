import React from "react";
import { Link, useLocation } from "react-router-dom";
import { tdContactEmail } from "common/config";
import styles from "./SignupInfo.module.scss";
import routes from "common/routes";

interface LocationState {
  signupEmail: string;
}

export default function SignupInfo() {
  let location = useLocation<LocationState>();
  const signupEmail = location.state?.signupEmail;
  return (
    <div className={styles.signupInfoContainer}>
      <section className="section section--white">
        <h2 className="h2 tw-mb-6">On y est presque !</h2>

        <p className="lead-text tw-mb-6">
          Un mail de confirmation vous a été envoyé à l'adresse {signupEmail}
          <span role="img" aria-label="Valise" className="tw-ml-1">
            📨
          </span>
        </p>
        <ul className="tw-mb-4">
          <li>
            <span
              role="img"
              aria-label="Index d'une main pointant à droite"
              className="tw-mr-1"
            >
              👉
            </span>
            Il peut mettre quelques minutes à arriver, merci pour votre patience
          </li>
          <li>
            <span
              role="img"
              aria-label="Index d'une main pointant à droite"
              className="tw-mr-1"
            >
              👉
            </span>
            Merci de vérifier vos spams
          </li>
          <li>
            <span
              role="img"
              aria-label="Index d'une main pointant à droite"
              className="tw-mr-1"
            >
              👉
            </span>
            Pour recevoir nos emails sans encombres, vous pouvez ajouter
            hello@trackdechets.beta.gouv.fr à votre liste de contacts
          </li>
        </ul>
        <p className="lead-text tw-mb-5">
          Merci de noter que le message peut ne pas arriver pour les raisons
          suivantes:
        </p>
        <ul className="tw-mb-4">
          <li>- Adresse email erronée</li>
          <li>- Antivirus ou suite logicielle de sécurité trop restrictifs</li>
        </ul>
        <p className="body-text">
          Afin de finaliser votre inscription, veuillez cliquer dans le lien qui
          vous a été envoyé par mail. Vous pourrez ensuite vous connecter à
          Trackdéchets.
          <span role="img" aria-label="Fusée">
            🚀
          </span>
        </p>

        <p className="body-text">
          Une fois connecté, vous aurez la possibilité de créer un établissement
          dans Trackéchets pour commencer à déclarer vos bordereaux. Si votre
          établissement existe déjà, adressez vous à un administrateur de votre
          entreprise et demandez lui de vous inviter.
        </p>

        <p className="body-text">
          Des questions, des interrogations ? N'hésitez pas à{" "}
          <a href={`mailto:${tdContactEmail}`} className="link">
            nous contacter
          </a>
          .
        </p>
        <p className="form__actions">
          <Link to={routes.login} className="btn btn--primary">
            Se connecter
          </Link>
        </p>
      </section>
    </div>
  );
}
