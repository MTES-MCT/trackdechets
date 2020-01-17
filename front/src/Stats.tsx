import React from "react";
import "./Stats.scss";

export default function Stats() {
  const metabaseHost = process.env.REACT_APP_METABASE_HOST;
  const metabaseUrlScheme = process.env.REACT_APP_METABASE_URL_SCHEME;

  return (
    <>
      <section className="section">
        <div className="container">
          <h2 className="text-center">Déchets dangereux traçés dans TD</h2>

          <div className="row">
            {/* Nbre de bordereaux dématérialisé crées par semaine */}
            <iframe
              title="question1"
              src={`${metabaseUrlScheme}://${metabaseHost}/public/question/${process.env.REACT_APP_METABASE_QUESTION_ID_1}`}
              frameBorder="0"
              width="800"
              height="400"
              allowTransparency
            ></iframe>
          </div>
          <div className="row">
            {/* Pourcentage de BSD tracés de bout en bout  */}
            <iframe
              title="question2"
              src={`${metabaseUrlScheme}://${metabaseHost}/public/question/${process.env.REACT_APP_METABASE_QUESTION_ID_2}`}
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency
            ></iframe>
            {/* Pourcentage de déchets valorisés */}
            <iframe
              title="question3"
              src={`${metabaseUrlScheme}://${metabaseHost}/public/question/${process.env.REACT_APP_METABASE_QUESTION_ID_3}`}
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency
            ></iframe>
            {/* Tonnage reçu */}
            <iframe
              title="question4"
              src={`${metabaseUrlScheme}://${metabaseHost}/public/question/${process.env.REACT_APP_METABASE_QUESTION_ID_4}`}
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency
            ></iframe>
          </div>
        </div>
      </section>

      <hr />
      <section className="section">
        <div className="container">
          <h2 className="text-center">
            Les utilisateurs et partenaires de Trackdéchets
          </h2>
          <div className="row">
            {/* Profils utilisateurs par catégorie */}
            <iframe
              title="question5"
              src={`${metabaseUrlScheme}://${metabaseHost}/public/question/${process.env.REACT_APP_METABASE_QUESTION_ID_5}`}
              frameBorder="0"
              width="700"
              height="400"
              allowTransparency
            ></iframe>
            {/* Nombre d'outils connectés à Trackdéchets */}
            <iframe
              title="question6"
              src={`${metabaseUrlScheme}://${metabaseHost}/public/question/${process.env.REACT_APP_METABASE_QUESTION_ID_6}`}
              frameBorder="0"
              width="350"
              height="400"
              allowTransparency
            ></iframe>
          </div>
        </div>
      </section>
      <hr />
      <section className="section">
        <div className="container">
          <h2 className="text-center">
            Sécurisation écosystème déchets dangeureux
          </h2>
          <div className="row">
            {/* Nombre d'entreprises vérifiées dans TD */}
            <iframe
              title="question7"
              src={`${metabaseUrlScheme}://${metabaseHost}/public/question/${process.env.REACT_APP_METABASE_QUESTION_ID_7}`}
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency
            ></iframe>
            {/* Nombre de bordereaux transmis à des destinataires vérifiés */}
            <iframe
              title="question8"
              src={`${metabaseUrlScheme}://${metabaseHost}/public/question/${process.env.REACT_APP_METABASE_QUESTION_ID_8}`}
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency
            ></iframe>
          </div>
        </div>
      </section>
    </>
  );
}
