import { CompanySearchResult } from "codegen-ui";

export interface CompanySelectorProps {
  loading: boolean;
  selectedCompany?: CompanySearchResult;
  companies?: CompanySearchResult[];
  favorites?: CompanySearchResult[];
  disabled?: boolean;
  searchLabel?: string;
  onSearch: (search: string, postalCode: string) => void;
  onSelect: (company?: CompanySearchResult) => void;
}

export interface CompanySelectorItemProps {
  selected?: boolean;
  company: CompanySearchResult;
  onSelect: (company?: CompanySearchResult) => void;
  searchClue?: string;
  postalCodeClue?: string;
}
