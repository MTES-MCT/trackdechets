import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

export const AlreadyPendingAnonymousCompanyRequestInfo = () => {
  return (
    <Alert
      title="Demande de création de l'établissement en cours"
      severity="info"
      description={
        <span>
          Le SIRET renseigné correspond à celui d'une entreprise anonyme pour
          lequel une demande de création d'établissement est en cours. Pour plus
          d'informations, veuillez consulter cet article :
          https://faq.trackdechets.fr/inscription-et-gestion-de-compte/questions-frequentes#lors-de-la-creation-de-mon-etablissement-non-diffusible-mon-fichier-na-pas-ete-valide.-que-faire
        </span>
      }
    />
  );
};
