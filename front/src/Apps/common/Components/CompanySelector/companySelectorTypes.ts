import { CompanySearchResult } from "codegen-ui";

export interface CompanySelectorProps {
  loading: boolean;
  selectedCompany?: CompanySearchResult;
  companies?: CompanySearchResult[];
  favorites?: CompanySearchResult[];
  disabled?: boolean;
  // Texte qui s'affiche en petit sous le label de la barre de recherche
  searchHint?: string;
  // Texte qui s'affiche en petit sous le label du filtre de département
  departmentHint?: string;
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
