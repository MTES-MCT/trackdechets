import React, { useState } from "react";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import AccountApplicationsAccessTokens from "./AccessTokens/AccountApplicationsAccessTokens";
import AccountApplicationsAuthorizedApplications from "./AutorizedApplications/AccountApplicationsAuthorizedApplications";

const Dummy = () => <p></p>;

export default function AccountApplications() {
  const [selectedTabId, setSelectedTabId] = useState("tab1");

  const tabsContent = {
    tab1: AccountApplicationsAccessTokens,
    tab3: AccountApplicationsAuthorizedApplications
  };

  const CurrenTabComponent = tabsContent[selectedTabId] ?? Dummy;

  return (
    <Tabs
      selectedTabId={selectedTabId}
      tabs={[
        {
          tabId: "tab1",
          label: "Jetons d'accès à l'API"
        },
        {
          tabId: "tab3",
          label: "Applications autorisées"
        }
      ]}
      onTabChange={setSelectedTabId}
    >
      <CurrenTabComponent />
    </Tabs>
  );
}
