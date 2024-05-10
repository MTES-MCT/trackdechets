import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const AnonymousCompanyCreationSuccess = () => {
  return (
    <Alert
      title="Création de l'établissement confirmée"
      severity="success"
      description={
        <span>
          L'établissement a été ajouté à notre répertoire privé, vous pouvez dès
          à présent procéder à sa création sur Trackdéchets. Pour ce faire,
          rendez-vous sur l'onglet Mes établissements &gt; Créer un
          établissement, et saisissez son numéro de SIRET.
        </span>
      }
    />
  );
};
