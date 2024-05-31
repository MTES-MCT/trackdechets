import React from "react";
import {
  CompanyPrivate,
  UserRole,
  CompanyVerificationStatus
} from "@td/codegen-ui";
import CompanyMembersInvite from "./CompanyMembersInvite";
import * as COMPANY_CONSTANTS from "@td/constants";

import "./companyMembers.scss";
import CompanyMembersList from "./CompanyMembersList";

const { VITE_VERIFY_COMPANY } = import.meta.env;

interface CompanyMembersProps {
  company: CompanyPrivate;
}

const CompanyMembers = ({ company }: CompanyMembersProps) => {
  const isAdmin = company.userRole === UserRole.Admin;
  const isProfessional = company.companyTypes.some(ct =>
    COMPANY_CONSTANTS.PROFESSIONALS.includes(ct)
  );
  const isVerified =
    company.verificationStatus === CompanyVerificationStatus.Verified;

  return (
    <div className="company-members">
      {isAdmin &&
        (VITE_VERIFY_COMPANY !== "true" ||
        !isProfessional ||
        (isProfessional && isVerified) ? (
          <CompanyMembersInvite company={company} />
        ) : (
          <div className="fr-alert fr-alert--warning">
            <h3 className="fr-alert__title">
              Attention : vérification de l'entreprise
            </h3>
            <p>
              Vous ne pouvez pas inviter de nouveaux membres car l'établissement
              n'a pas encore été vérifié.
            </p>
          </div>
        ))}
      <CompanyMembersList company={company} />
    </div>
  );
};

export default CompanyMembers;
