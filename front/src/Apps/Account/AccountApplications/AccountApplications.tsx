import React, { useState } from "react";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import AccountApplicationsAccessTokens from "./AccessTokens/AccountApplicationsAccessTokens";
import AccountApplicationsAuthorizedApplications from "./AutorizedApplications/AccountApplicationsAuthorizedApplications";
import AccountApplicationsMyApplications from "./MyApplications/AccountApplicationsMyApplications";

const Dummy = () => <p></p>;

export default function AccountApplications() {
  const [selectedTabId, setSelectedTabId] = useState("tab1");

  const tabsContent = {
    tab1: AccountApplicationsAccessTokens,
    tab2: AccountApplicationsAuthorizedApplications,
    tab3: AccountApplicationsMyApplications
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
          tabId: "tab2",
          label: "Applications autorisées"
        },
        {
          tabId: "tab3",
          label: "Mes applications"
        }
      ]}
      onTabChange={setSelectedTabId}
    >
      <CurrenTabComponent />
    </Tabs>
  );
}
