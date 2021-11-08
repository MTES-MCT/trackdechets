import React from "react";
import { DEVELOPERS_DOCUMENTATION_URL } from "common/config";
import { Applications } from "./api";
import AccountFieldApiKey from "./fields/AccountFieldApiKey";

export default function AccountIntegrationApi() {
  return (
    <>
      <div className="notification">
        L'API Trackdéchets permet d'utiliser Trackdéchets via une solution
        informatique tierce (ERP, SaaS déchets, etc). Pour en savoir plus, nous
        vous invitons à consulter{" "}
        <a
          href={DEVELOPERS_DOCUMENTATION_URL}
          target="_blank"
          className="link"
          rel="noopener noreferrer"
        >
          la documentation
        </a>
      </div>
      <AccountFieldApiKey />
      <Applications />
    </>
  );
}
