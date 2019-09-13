import React from "react";
import "./Stats.scss";

export default function Stats() {
  return (
    <>
      <section className="section">
        <div className="container">
          <h2 className="text-center">Déchets dangereux traçés dans TD</h2>

          <div className="row">
            {/* Nbre de bordereaux dématérialisé crées par semaine */}
            <iframe
              src="http://51.254.35.113:3000/public/question/82437964-44ee-43ae-8267-a5b521e815b4"
              frameBorder="0"
              width="800"
              height="400"
              allowTransparency>
            </iframe>
          </div>
          <div className="row">
            {/* Pourcentage de BSD tracés de bout en bout  */}
            <iframe
              src="http://51.254.35.113:3000/public/question/fa7e2315-bbae-4cf6-ae0f-34cf4821c226"
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency>
            </iframe>
            {/* Pourcentage de déchets valorisés */}
            <iframe
              src="http://51.254.35.113:3000/public/question/f72b7a7a-3f75-4a46-839d-bffce3b87409"
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency>
            </iframe>
            {/* Tonnage reçu */}
            <iframe
              src="http://51.254.35.113:3000/public/question/657c9d7f-404f-40a2-9a74-fc808ceae95f"
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency>
            </iframe>
          </div>
        </div>
      </section>

      <hr/>
      <section className="section">
        <div className="container">
          <h2 className="text-center">Les utilisateurs et partenaires de Trackdéchets</h2>
          <div className="row">
            {/* Profils utilisateurs par catégorie */}
            <iframe
              src="http://51.254.35.113:3000/public/question/fc1df57e-d1c8-4150-a113-1f7bba5c1764"
              frameBorder="0"
              width="700"
              height="400"
              allowTransparency>
            </iframe>
            {/* Nombre d'outils connectés à Trackdéchets */}
            <iframe
              src="http://51.254.35.113:3000/public/question/d0ac5b40-b35e-4fa6-94f5-3b586ad8e349"
              frameBorder="0"
              width="350"
              height="400"
              allowTransparency>
            </iframe>
          </div>
        </div>
      </section>
      <hr/>
      <section className="section">
        <div className="container">
          <h2 className="text-center">Sécurisation écosystème déchets dangeureux</h2>
          <div className="row">
            {/* Nombre d'entreprises vérifiées dans TD */}
            <iframe
              src="http://51.254.35.113:3000/public/question/15cf54b7-28a4-4099-b033-111341937d77"
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency>
            </iframe>
            {/* Nombre de bordereaux transmis à des destinataires vérifiés */}
            <iframe
              src="http://51.254.35.113:3000/public/question/774a988a-039c-4bd0-b74a-54f5dcf251cc"
              frameBorder="0"
              width="350"
              height="250"
              allowTransparency>
            </iframe>
          </div>
        </div>
      </section>

    </>


  )
}