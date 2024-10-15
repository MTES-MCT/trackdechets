import React from "react";
import { CompanyPrivate } from "@td/codegen-ui";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { userRoleLabel } from "../../Companies/common/utils";
import styles from "./CompanyDisplay.module.scss";

type AccountCompanyNotificationsProps = {
  company: CompanyPrivate;
};

export default function CompanyDisplay({
  company
}: AccountCompanyNotificationsProps) {
  return (
    <>
      <h4 className={styles.companyName}>
        {company.name}
        {company.givenName && ` - ${company.givenName}`}
      </h4>
      <p className="fr-text">{company.orgId}</p>
      <Tag small className={styles.roleTag}>
        {userRoleLabel(company.userRole!)}
      </Tag>
    </>
  );
}
