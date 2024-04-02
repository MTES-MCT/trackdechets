import * as yup from "yup";
import {
  CollectorType,
  Company,
  CompanyType,
  WasteProcessorType
} from "@prisma/client";
import {
  cleanClue,
  isForeignVat,
  isSiret,
  isVat,
  countries as vatCountries
} from "@td/constants";
import { checkVAT } from "jsvat";
import { FormCompany } from "../generated/graphql/types";
import countries, { Country } from "world-countries";

export const receiptSchema = yup.object().shape({
  validityLimit: yup.date().required()
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
export function isCrematorium(company: Company) {
  return company.companyTypes.includes(CompanyType.CREMATORIUM);
}

const toSet = (_, value) => [...new Set(value?.filter(Boolean))];

export const companyTypesValidationSchema = yup.object({
  companyTypes: yup
    .array()
    .of(yup.string().oneOf(Object.values(CompanyType)))
    .ensure()
    .compact()
    .transform(toSet)
    .required()
    .min(1),
  collectorTypes: yup
    .array()
    .of(yup.string().oneOf(Object.values(CollectorType)))
    // .ensure()
    .compact()
    .transform(toSet)
    .test(
      "collectorTypes",
      "Your company needs to be a Collector to have collectorTypes",
      async (collectorTypes, ctx) => {
        const { companyTypes } = ctx.parent;

        if (
          collectorTypes?.length &&
          !companyTypes.includes(CompanyType.COLLECTOR)
        ) {
          return false;
        }

        return true;
      }
    ),
  wasteProcessorTypes: yup
    .array()
    .of(yup.string().oneOf(Object.values(WasteProcessorType)))
    // .ensure()
    .compact()
    .transform(toSet)
    .test(
      "wasteProcessorTypes",
      "Your company needs to be a WasteProcessor to have wasteProcessorTypes",
      async (wasteProcessorTypes, ctx) => {
        const { companyTypes } = ctx.parent;

        if (
          wasteProcessorTypes?.length &&
          !companyTypes.includes(CompanyType.WASTEPROCESSOR)
        ) {
          return false;
        }

        return true;
      }
    )
});

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
