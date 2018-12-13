import React from "react";
import { Me } from "../../login/model";
import { Formik } from "formik";

interface IProps {
  me: Me;
}

export default function Account({ me }: IProps) {
  return (
    <div className="main">
      <div className="panel">
        <div className="panel__header">
          <h3>Mon compte</h3>
        </div>

        <p>
          Vous êtes connecté en tant que {me.name}
          {` < ${me.email} >`}
        </p>
        <p>
          vous administrez la compagnie <strong>{me.company.siret}</strong>
        </p>
        <button className="button">Me déconnecter</button>
      </div>
    </div>
  );
}
