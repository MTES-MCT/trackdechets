import React from "react";
import { Link } from "react-router-dom";

export default function SignupInfo() {
  return (
    <div className="container">
      <h2>
        Un mail de confirmation vous a été envoyé à l'adresse indiquée ! 📨
      </h2>
      <p>
        Afin de finaliser votre inscription, veuillez cliquer dans le lien qui
        vous a été envoyé par mail. Vous pourrez ensuite vous connecter à
        Trackdéchets et commencer à utiliser ses différentes fonctionnalités !
        🚀
      </p>
      <p>
        Des questions, des interrogations, n'hésitez pas à nous contacter à
        l'adresse suivante :{" "}
        <a href="mailto:emmanuel.flahaut@developpement-durable.gouv.fr">
          emmanuel.flahaut@developpement-durable.gouv.fr
        </a>
      </p>
      <Link to="/login" className="button">
        Se connecter
      </Link>
    </div>
  );
}
