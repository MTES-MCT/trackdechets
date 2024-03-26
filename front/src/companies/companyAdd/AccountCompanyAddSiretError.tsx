import React from "react";
import Alert from "@codegouvfr/react-dsfr/Alert";

const AccountCompanyAddSiretError = ({ errorMsg }) => {
  if (errorMsg === "Cet établissement est fermé") {
    return (
      <Alert
        severity="error"
        title={errorMsg}
        description={`Il ne peut pas être inscrit. Il est possible que votre SIRET ait changé. Pour vérifier s'il existe encore, RDV sur https://annuaire-entreprises.data.gouv.fr Pour déclarer un changement, RDV sur https://entreprendre.service-public.fr/vosdroits/F31479`}
      />
    );
  }

  return <Alert severity="error" title="Erreur" description={errorMsg} />;
};

export default AccountCompanyAddSiretError;
