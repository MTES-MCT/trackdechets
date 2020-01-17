import React from "react";
import { Link } from "react-router-dom";

export default function SignupInfo() {
  return (
    <div className="container">
      <section className="section section-white">
        <h2>On y est presque !</h2>
        <p className="lead-text">
          Un mail de confirmation vous a été envoyé à l'adresse indiquée{" "}
          <span role="img" aria-label="Valise">
            📨
          </span>
        </p>
        <p>
          Afin de finaliser votre inscription, veuillez cliquer dans le lien qui
          vous a été envoyé par mail. Vous pourrez ensuite vous connecter à
          Trackdéchets.
          <span role="img" aria-label="Fusée">
            🚀
          </span>
        </p>

        <p>
          Une fois connecté, vous aurez la possibilité de créer un établissement
          dans Trackéchets pour commencer à déclarer vos bordereaux. Si votre
          établissement existe déjà, adressez vous àun administrateur de votre
          entreprise et demandez lui de vous inviter.
        </p>

        <p>
          Des questions, des interrogations ? N'hésitez pas à{" "}
          <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">
            nous contacter
          </a>
          .
        </p>
        <Link to="/login" className="button">
          Se connecter
        </Link>
      </section>
    </div>
  );
}
