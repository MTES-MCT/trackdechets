import React from "react";
import CompanySelector from "./company/CompanySelector";
import ProcessingOperation from "./processing-operation/ProcessingOperation";
import "./Recipient.scss";

export default function Recipient() {
  return (
    <React.Fragment>
      <h4>Certificat d'acceptation préalable</h4>
      <div className="form__group">
        <label>
          Numéro de CAP:
          <input type="text" />
        </label>
      </div>

      <h4>Entreprise de destination</h4>

      <div className="text-quote recipient">
        <p>
          Pour vous assurer que l'entreprise de destination est autorisée à
          recevoir le déchet, vous pouvez consulter{" "}
          <a href="http://www.installationsclassees.developpement-durable.gouv.fr/rechercheICForm.php">
            la liste des installation classées.
          </a>
        </p>
      </div>

      <CompanySelector value={null} />

      <h4>Informations complémentaires</h4>

      <div className="form__group">
        <ProcessingOperation />
      </div>

      <div className="form__group">
        <label>
          Personne à contacter:
          <input type="text" />
        </label>

        <label>
          Téléphone ou Fax:
          <input type="text" />
        </label>

        <label>
          Mail:
          <input type="text" />
        </label>
      </div>
    </React.Fragment>
  );
}
