import { CompanySearchResult } from "@td/codegen-ui";

export interface CompanySelectorProps {
  loading: boolean;
  selectedCompany?: CompanySearchResult | null;
  // Erreur relative à l'établissement sélectionneé. Exemple :
  // Le transporteur n'est pas inscrit sur Trackdéchets ou n'a pas le
  // bon profil.
  selectedCompanyError?: string | null;
  companies?: CompanySearchResult[];
  favorites?: CompanySearchResult[];
  disabled?: boolean;
  // Texte qui s'affiche en petit sous le label de la barre de recherche
  searchHint?: string;
  // Texte qui s'affiche en petit sous le label du filtre de département
  departmentHint?: string;
  onSearch: (search: string, postalCode: string) => void;
  onSelect: (company: CompanySearchResult) => void;
}

export interface CompanySelectorItemProps {
  selected?: boolean;
  // Erreur relative à l'établissement sélectionneé. Exemple :
  // Le transporteur n'est pas inscrit sur Trackdéchets ou n'a pas le
  // bon profil.
  selectedError?: string | null;
  company: CompanySearchResult;
  onSelect: (company: CompanySearchResult) => void;
  searchClue?: string;
  postalCodeClue?: string;
}
