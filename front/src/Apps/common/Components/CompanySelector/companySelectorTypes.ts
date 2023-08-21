import { CompanySearchResult } from "generated/graphql/types";

export interface CompanySelectorProps {
  loading: boolean;
  onSearch: (search: string, postalCode: string) => void;
  onSelect: (company?: CompanySearchResult) => void;
  companies?: CompanySearchResult[];
  favorites?: CompanySearchResult[];
  selectedCompany?: CompanySearchResult;
  disabled?: boolean;
}

export interface CompanySelectorItemProps {
  selected?: boolean;
  company: CompanySearchResult;
  onSelect: (company?: CompanySearchResult) => void;
  searchClue?: string;
  postalCodeClue?: string;
}
