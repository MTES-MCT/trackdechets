import { AnonymousCompaniesRequests } from "./AnonymousCompaniesRequests";
import React, { useState } from "react";
import { CreateAnonymousCompany } from "./CreateAnonymousCompany";
import Button from "@codegouvfr/react-dsfr/Button";

export const AnonymousCompaniesDashboard = () => {
  const [createAnonymousCompany, setCreateAnonymousCompany] = useState<
    string | boolean
  >(false);

  // Either display the table of all anonymous company requests...
  if (!createAnonymousCompany) {
    return (
      <AnonymousCompaniesRequests
        onCreateAnonymousCompany={(requestId?: string) => {
          setCreateAnonymousCompany(requestId ?? true);
        }}
      />
    );
  }

  // ...or the form to create an anonymous company
  return (
    <div style={{ height: "100%" }}>
      <div>
        <Button
          iconId="fr-icon-arrow-left-line"
          onClick={() => setCreateAnonymousCompany(false)}
          priority="tertiary no outline"
        >
          Précédent
        </Button>
      </div>

      <div style={{ height: "100%" }}>
        <CreateAnonymousCompany
          onCompanyCreated={() => setCreateAnonymousCompany(false)}
          anonymousCompanyRequestId={
            typeof createAnonymousCompany == "boolean"
              ? undefined
              : createAnonymousCompany
          }
        />
      </div>
    </div>
  );
};
