import { AnonymousCompaniesRequests } from "./AnonymousCompaniesRequests";
import React, { useState } from "react";
import { CreateAnonymousCompany } from "./CreateAnonymousCompany";
import Button from "@codegouvfr/react-dsfr/Button";
import styles from "./AnonymousCompany.module.scss";

export const AnonymousCompaniesDashboard = () => {
  const [requestSiret, setRequestSiret] = useState<string | boolean>(false);

  // Either display the table of all anonymous company requests...
  if (!requestSiret) {
    return (
      <AnonymousCompaniesRequests
        onCreateAnonymousCompany={(siret?: string) => {
          setRequestSiret(siret ?? true);
        }}
      />
    );
  }

  // ...or the form to create an anonymous company
  return (
    <div className={styles.h100}>
      <div>
        <Button
          iconId="fr-icon-arrow-left-line"
          onClick={() => setRequestSiret(false)}
          priority="tertiary no outline"
        >
          Précédent
        </Button>
      </div>

      <div className={styles.h100}>
        <CreateAnonymousCompany
          onCompanyCreated={() => setRequestSiret(false)}
          anonymousCompanyRequestSiret={
            typeof requestSiret == "boolean" ? undefined : requestSiret
          }
        />
      </div>
    </div>
  );
};
