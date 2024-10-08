import React from "react";
import { CompanyPrivate } from "@td/codegen-ui";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { userRoleLabel } from "../../Companies/common/utils";

type AccountCompanyNotificationsProps = {
  company: CompanyPrivate;
};

export default function AccountCompany({
  company
}: AccountCompanyNotificationsProps) {
  return (
    <div>
      <div>
        <div style={{ color: "#000091", fontWeight: "bold" }}>
          {company.name}
          {company.givenName && ` - ${company.givenName}`}
        </div>
        <p className="fr-text">{company.orgId}</p>
        <Tag
          small
          style={{
            color: "var(--text-action-high-blue-france)",
            backgroundColor: "var(--background-action-low-blue-france)"
          }}
        >
          {userRoleLabel(company.userRole!)}
        </Tag>
      </div>
    </div>
  );
}
