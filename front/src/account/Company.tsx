import React, { useState } from "react";

import InviteNewUser from "./InviteNewUser";
import EditCompany from "./EditCompany";
import { COMPANY_TYPES } from "../login/CompanyType";

type Props = {
  company: {
    id: string;
    siret: string;
    name: string;
    address: string;
    securityCode: string;
    companyTypes: string[];
    isAdmin: boolean;
  };
};

export default function Company({ company }: Props) {
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="panel" key={company.siret}>
      <div className="company__address">
        <p className="mb-1">
          <strong>{company.name}</strong>
        </p>
        <p>
          Numéro SIRET : <strong>{company.siret}</strong>
        </p>
        <p>
          Profil de l'entreprise:{" "}
          {company.companyTypes
            .map(ut => {
              const obj = COMPANY_TYPES.find(t => t.value === ut);
              return obj ? obj.label : "";
            })
            .join(", ")}
        </p>
        <p>{company.address}</p>
        <p>
          Code de sécurité: <strong>{company.securityCode}</strong>
        </p>
      </div>
      {company.isAdmin && (
        // The user is admin of this company, allow
        // editing info and invite new members
        <>
          <button
            className="button"
            onClick={() => setShowCompanyForm(!showCompanyForm)}
          >
            Éditer les informations de l'entreprise
          </button>
          <button className="button" onClick={() => setShowInvite(!showInvite)}>
            Inviter des collaborateurs
          </button>
          {showCompanyForm && (
            <EditCompany
              siret={company.siret}
              companyTypes={company.companyTypes}
              onSubmit={() => setShowCompanyForm(!showCompanyForm)}
            />
          )}
          {showInvite && <InviteNewUser siret={company.siret} />}
        </>
      )}
    </div>
  );
}
