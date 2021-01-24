import React from "react";
import AccountFieldPersonalAccessTokens from "./fields/AccountFieldPersonalAccessTokens";
import AccountFieldLinkedApplications from "./fields/AccountFieldLinkedApplications";

export default function AccountIntegrationApi() {
  return (
    <>
      <div className="notification">
        L'API Trackdéchets permet d'utiliser Trackdéchets via une solution
        informatique tierce (ERP, SaaS déchets, etc). Pour en savoir plus, nous
        vous invitons à consulter{" "}
        <a
          href="https://developers.trackdechets.beta.gouv.fr/"
          target="_blank"
          className="link"
          rel="noopener noreferrer"
        >
          la documentation
        </a>
      </div>
      <AccountFieldPersonalAccessTokens />
      <AccountFieldLinkedApplications />
    </>
  );
}
