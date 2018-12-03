import React from "react";

export default function Signup() {
  return (
    <div className="container">
      <div className="form__group">
        <label>
          Email:
          <input type="text" name="login" />
        </label>
      </div>

      <div className="form__group">
        <label>
          Nom et prénom:
          <input type="text" name="login" />
        </label>
      </div>

      <div className="form__group">
        <label>
          Téléphone:
          <input type="text" name="login" />
        </label>
      </div>

      <div className="form__group">
        <label>
          Mot de passe:
          <input type="password" name="password" />
        </label>
      </div>

      <div className="form__group">
        <label>
          Vérification du mot de passe:
          <input type="password" name="password" />
        </label>
      </div>

      <button className="button">Se connecter</button>
    </div>
  );
}
