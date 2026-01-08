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
import CompanyMembersRequestsList from "./CompanyMembersRequestsList";
import { envConfig } from "../../../common/envConfig";

const { VITE_VERIFY_COMPANY } = envConfig;

export type CompanyPrivateMembers = Pick<
  CompanyPrivate,
  "userRole" | "companyTypes" | "verificationStatus" | "orgId" | "users"
>;

interface CompanyMembersProps {
  company: CompanyPrivateMembers;
  isTDAdmin?: boolean;
}

const CompanyMembers = ({
  company,
  isTDAdmin = false
}: CompanyMembersProps) => {
  const isAdmin = company.userRole === UserRole.Admin || isTDAdmin;
  const isProfessional = company.companyTypes.some(ct =>
    COMPANY_CONSTANTS.PROFESSIONALS.includes(ct)
  );
  const isVerified =
    company.verificationStatus === CompanyVerificationStatus.Verified;

  return (
    <div className="company-members">
      {isAdmin && <CompanyMembersRequestsList company={company} />}
      {isAdmin &&
        (!VITE_VERIFY_COMPANY ||
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
      <CompanyMembersList company={company} isTDAdmin={isTDAdmin} />
    </div>
  );
};

export default CompanyMembers;
