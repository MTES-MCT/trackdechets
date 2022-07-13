export interface ViesResult {
  countryCode: string;
  vatNumber: string;
  requestDate: string;
  valid: boolean;
  name?: string;
  address?: string;
}

export interface CompanyVatSearchResult {
  vatNumber: string;
  address: string;
  name: string;
  codePaysEtrangerEtablissement: string;
  // required to ensure compatibility with the common CompanySearchResult interface
  statutDiffusionEtablissement: "O" | "N";
  etatAdministratif: "A" | "F";
}
