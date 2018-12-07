import React from "react";
import { Route, RouteComponentProps, Link } from "react-router-dom";
import FormContainer from "./FormContainer";

export default function FormIntro({ match }: RouteComponentProps) {
  return (
    <main className="main">
      <div className="container">
        <Route
          exact
          path={match.path}
          render={() => (
            <div>
              <h1>Bienvenue sur le formulaire de création</h1>
              <p>
                Blabla ce formulaire permet d'éditer un bordereau BSD en
                ligne... Lorem ipsum.
              </p>

              <div className="notification warning">
                Les formulaires avec annexe (Annexe 1 et Annexe 2) ne sont pas
                encore gérés par cet outil.
              </div>

              <Link to={`${match.path}/steps`}>
                <button className="button">Créer...</button>
              </Link>
            </div>
          )}
        />

        <Route path={`${match.path}/steps/:id?`} component={FormContainer} />
      </div>
    </main>
  );
}
