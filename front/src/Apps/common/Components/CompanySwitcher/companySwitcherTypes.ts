import { CompanyPrivate } from "@td/codegen-ui";

export interface CompanySwitcherProps {
  currentOrgId: string;
  companies: CompanyPrivate[];
  handleCompanyChange: (orgId: string) => void;
}
