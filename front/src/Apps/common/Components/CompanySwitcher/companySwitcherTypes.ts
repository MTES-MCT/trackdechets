export interface CompanySwitcherProps {
  currentOrgId: string;
  handleCompanyChange: (orgId: string) => void;
}
