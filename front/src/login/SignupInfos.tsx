import React from "react";
import { Link } from "react-router-dom";

export default function SignupInfo() {
  return (
    <div className="container">
      <h2>Un mail de confirmation vous a été envoyé</h2>
      <p>
        Afin de finaliser votre inscription, veuillez cliquer dans le lien qui
        vous a été envoyé par mail. Vous pourrez ensuite vous connecter.
      </p>
      <Link to="/login" className="button">
        Se connecter
      </Link>
    </div>
  );
}
