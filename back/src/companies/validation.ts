import * as yup from "yup";
import {
  Company,
  CompanyType,
  WasteProcessorType,
  WasteVehiclesType
} from "@prisma/client";
import {
  cleanClue,
  isForeignVat,
  isSiret,
  isVat,
  countries as vatCountries
} from "@td/constants";
import { checkVAT } from "jsvat";
import type { FormCompany } from "@td/codegen-back";
import countries, { Country } from "world-countries";
import { todayAtMidnight } from "../utils";

export const receiptSchema = yup.object().shape({
  validityLimit: yup.date().min(todayAtMidnight()).required()
});

export function isCollector(company: Company) {
  return company.companyTypes.includes(CompanyType.COLLECTOR);
}

export function isWasteProcessor(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTEPROCESSOR);
}

export function isWasteCenter(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTE_CENTER);
}

export function isWasteVehicles(company: Company) {
  return company.companyTypes.includes(CompanyType.WASTE_VEHICLES);
}

export function isBroyeur(company: Company) {
  return company.wasteVehiclesTypes.includes(WasteVehiclesType.BROYEUR);
}

export function isDemolisseur(company: Company) {
  return company.wasteVehiclesTypes.includes(WasteVehiclesType.DEMOLISSEUR);
}

export function isTransporter({
  companyTypes
}: {
  companyTypes: CompanyType[];
}) {
  return companyTypes.includes(CompanyType.TRANSPORTER);
}

export function isForeignTransporter({
  companyTypes,
  vatNumber
}: {
  companyTypes: CompanyType[];
  vatNumber?: string | null;
}) {
  return isTransporter({ companyTypes }) && isForeignVat(vatNumber);
}

export function isWorker(company: Company) {
  return company.companyTypes.includes(CompanyType.WORKER);
}

export function isBroker(company: Company) {
  return company.companyTypes.includes(CompanyType.BROKER);
}

export function isTrader(company: Company) {
  return company.companyTypes.includes(CompanyType.TRADER);
}

export function hasCremationProfile(company: Company) {
  return company.wasteProcessorTypes.includes(WasteProcessorType.CREMATION);
}

const FRENCH_COUNTRY = countries.find(country => country.cca2 === "FR");
export const getcompanyCountry = (
  company: FormCompany | null | undefined
): Country | undefined => {
  if (!company) return FRENCH_COUNTRY; // default

  // forcer FR si le siret est valide
  if (company.siret && isSiret(company.siret)) {
    return countries.find(country => country.cca2 === "FR");
  } else if (company.vatNumber && isVat(company.vatNumber)) {
    // trouver automatiquement le pays selon le numéro de TVA
    const vatCountryCode = checkVAT(cleanClue(company.vatNumber), vatCountries)
      ?.country?.isoCode.short;

    return countries.find(country => country.cca2 === vatCountryCode);
  }

  // reconnaitre le pays directement dans le champ country
  return countries.find(country => country.cca2 === company.country);
};

export const getReadableCompanyCountry = (company?: FormCompany | null) => {
  const companyCountry = getcompanyCountry(company);

  if (!companyCountry || companyCountry?.cca2 === "FR") {
    return "France";
  }

  return companyCountry?.name.common;
};

interface IsCompanyProps {
  company?: FormCompany | null;
  isForeignShip?: boolean;
  isPrivateIndividual?: boolean;
}

export const isFrenchCompany = ({
  company,
  isForeignShip,
  isPrivateIndividual
}: IsCompanyProps) => {
  const companyCountry = getcompanyCountry(company);

  return (
    isSiret(company?.siret) &&
    !isForeignShip &&
    !isPrivateIndividual &&
    companyCountry?.cca2 === "FR"
  );
};

export const isEUCompany = ({
  company,
  isForeignShip,
  isPrivateIndividual
}: IsCompanyProps) => {
  return isVat(company?.vatNumber) && !isForeignShip && !isPrivateIndividual;
};

export const isForeignCompany = ({
  company,
  isForeignShip
}: Omit<IsCompanyProps, "isPrivateIndividual">) => {
  const companyCountry = getcompanyCountry(company);

  return (
    Boolean(company?.extraEuropeanId || company?.vatNumber || isForeignShip) &&
    companyCountry?.cca2 !== "FR"
  );
};
