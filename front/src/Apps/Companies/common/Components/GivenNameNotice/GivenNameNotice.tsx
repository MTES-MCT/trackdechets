import React from "react";
import "./givenNameNotice.scss";

const GivenNameNotice = () => (
  <div className="fr-notice--warning">
    <div className="fr-notice__body fr-p-2w">
      <p>
        Le nom usuel sera partagé avec les autres utilisateurs de Trackdéchets.
      </p>
    </div>
  </div>
);

export const ContactNotice = () => (
  <div className="fr-notice--warning">
    <div className="fr-notice__body fr-p-2w">
      <p>
        Les informations de contact seront partagées avec les autres
        utilisateurs de Trackdéchets.
      </p>
    </div>
  </div>
);

export default GivenNameNotice;
